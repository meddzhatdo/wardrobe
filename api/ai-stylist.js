import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';
import { checkRateLimit } from './_rateLimit.js';

initSentry();

const BASE_SYSTEM_PROMPT = `You are a knowledgeable, friendly personal stylist. You give concise, practical style advice.
When the user shares their wardrobe items, reference them specifically by name. Always bold item names using markdown (e.g. **Item Name**) whenever you mention them.
Keep responses conversational and under 300 words unless a detailed breakdown is genuinely needed.
Do not use excessive bullet points — prefer flowing sentences. Never mention that you are an AI.
Always tailor your suggestions to the user's stated style direction and outfit goals when they are provided. If the user has a style direction (feminine, masculine, or neutral), respect it in every suggestion — don't recommend items or silhouettes that clash with it unless the user explicitly asks you to go outside it.`;

const REFS_SYSTEM_ADDENDUM = `

OUTPUT FORMAT RULE (non-negotiable): Never include [ID:xxx] tags in your response text — they are for internal tracking only and must never appear in the message the user sees. After every response where a wardrobe list was provided, your final line must be exactly:
REFS:["id1","id2"]
Fill the array with the [ID:xxx] values from the wardrobe list for every item you explicitly named in your response. Use REFS:[] if you named none. This line must always be present and must always be last.`;

const OUTFIT_SYSTEM_ADDENDUM = `

COLLAGE FORMAT RULE (non-negotiable): Never include [ID:xxx] tags in your response text — they are for internal tracking only. The user wants you to put together a specific outfit from their wardrobe. In your response, describe the outfit you are assembling and why the pieces work together. Your very last line must be exactly:
OUTFIT:{"outfitName":"...","itemIds":["id1","id2",...]}
Replace "..." with a short outfit name (2-4 words). Fill itemIds with the [ID:xxx] values for the 2-5 items in the outfit. Choose items that form a complete, cohesive look. Do not output a REFS line.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://wardrobe-app.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    await logAuditEvent({ event: 'auth_failure', endpoint: '/api/ai-stylist', req });
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { limited } = await checkRateLimit({ userId: user.id, endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60, event: 'stylist_call' });
  if (limited) return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });

  const { messages, includeWardrobe, includeCollage, items = [], userProfile = {} } = req.body;

  if (includeCollage) {
    const { limited: collageLimited, resetsAt } = await checkRateLimit({ userId: user.id, endpoint: '/api/ai-stylist', maxRequests: 5, windowMinutes: 1440, event: 'stylist_collage' });
    if (collageLimited) return res.status(429).json({ error: 'collage_limit', message: "You've used your 5 collage generations for today.", resetsAt });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (messages.length > 100) {
    return res.status(400).json({ error: 'Too many messages' });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }
  if (items.length > 300) {
    return res.status(400).json({ error: 'Too many items' });
  }
  // Validate message structure before processing
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return res.status(400).json({ error: 'Invalid message' });
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message structure' });
    }
  }

  const sanitize = (val, max) =>
    typeof val === 'string' ? val.replace(/[\r\n\t`\u2028\u2029]/g, ' ').slice(0, max).trim() : '';

  // SSRF guard: only fetch images from our own Supabase storage
  const isAllowedImageUrl = (url) => {
    try {
      const { protocol, hostname } = new URL(url);
      if (protocol !== 'https:') return false;
      const supabaseHost = new URL(process.env.VITE_SUPABASE_URL).hostname;
      return hostname === supabaseHost;
    } catch {
      return false;
    }
  };

  const content = [];

  // Send descriptions for all items; fetch images for only the first 12 (token budget)
  const sentItems = [];
  if (includeWardrobe && items.length > 0) {
    const wardrobeLines = [];

    for (const item of items) {
      sentItems.push(item);
      const name      = sanitize(item.name,     80) || 'unknown item';
      const category  = sanitize(item.category, 50) || 'unknown';
      const color     = sanitize(item.color,    40);
      const brand     = sanitize(item.brand,    50);
      const warmth    = sanitize(item.attributes?.warmthRating || '', 20);
      const price     = typeof item.price === 'number' && item.price > 0 ? item.price : (typeof item.price === 'string' && item.price ? parseFloat(item.price) : null);
      const timesWorn = typeof item.timesWorn === 'number' ? item.timesWorn : null;
      const wornLabel = timesWorn === 0 ? 'never worn' : (timesWorn != null ? `worn ${timesWorn}×` : null);
      const desc = [
        name, category,
        color   && `color: ${color}`,
        brand   && `brand: ${brand}`,
        warmth && warmth !== 'none' && `warmth: ${warmth}`,
        price  && !isNaN(price) && `cost: $${price}`,
        wornLabel,
      ].filter(Boolean).join(' | ');
      wardrobeLines.push(`[ID:${item.id}] ${desc}`);
    }

    for (const item of items.slice(0, 12)) {
      if (item.image && isAllowedImageUrl(item.image)) {
        try {
          const imgRes = await fetch(item.image, { signal: AbortSignal.timeout(6000) });
          if (imgRes.ok) {
            const buffer    = await imgRes.arrayBuffer();
            const base64    = Buffer.from(buffer).toString('base64');
            const mediaType = imgRes.headers.get('content-type') || 'image/jpeg';
            content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
          }
        } catch {}
      }
    }

    const country = sanitize(userProfile?.country, 30);
    const goals   = Array.isArray(userProfile?.outfitGoals)
      ? userProfile.outfitGoals.map(g => sanitize(g, 40)).filter(Boolean).join(', ')
      : '';
    const stylePreferences = Array.isArray(userProfile?.stylePreferences)
      ? userProfile.stylePreferences.map(s => sanitize(s, 20)).filter(Boolean).join(', ')
      : '';
    content.push({
      type: 'text',
      text:
        `Here is the user's wardrobe (${items.length} items):\n${wardrobeLines.join('\n')}` +
        (country          ? `\nUser is based in: ${country}`             : '') +
        (stylePreferences ? `\nStyle direction: ${stylePreferences}`     : '') +
        (goals            ? `\nOutfit goals: ${goals}`                   : '') +
        '\n\nPlease use this wardrobe context to answer their question.',
    });
  }

  const anthropicMessages = [];

  if (content.length > 0) {
    anthropicMessages.push({ role: 'user', content });
    anthropicMessages.push({ role: 'assistant', content: "Got it — I've reviewed your wardrobe. What would you like to know?" });
  }

  for (const msg of messages) {
    anthropicMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitize(msg.content, 2000),
    });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: (() => {
          const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const month = new Date().getMonth();
          const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';
          const dateCtx = `\n\nToday's date is ${date} — currently ${season} in the northern hemisphere (adjust if the user is in the southern hemisphere). When recommending pieces, respect the current season: avoid items with warmth: high or very_high in summer, and avoid warmth: low items as standalone outfits in winter. The wardrobe list also includes wear history — if the user asks for never-worn or unworn pieces, only choose items marked "never worn".`;
          const stylePrefs = Array.isArray(userProfile?.stylePreferences)
            ? userProfile.stylePreferences.map(s => sanitize(s, 20)).filter(Boolean)
            : [];
          const styleCtx = stylePrefs.length
            ? `\n\nThis user's style direction is: ${stylePrefs.join(', ')}. Keep all your suggestions aligned with this — every outfit, piece, or recommendation should feel natural within their style direction.`
            : '';
          const base = BASE_SYSTEM_PROMPT + dateCtx + styleCtx;
          return sentItems.length > 0 ? base + (includeCollage ? OUTFIT_SYSTEM_ADDENDUM : REFS_SYSTEM_ADDENDUM) : base;
        })(),
        messages: anthropicMessages,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', await anthropicRes.text());
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await anthropicRes.json();
    let raw = data.content?.[0]?.text ?? '';
    if (!raw) return res.status(502).json({ error: 'Empty response from AI' });

    // Parse and strip the REFS or OUTFIT line
    let referencedItemIds = [];
    let outfit = undefined;

    if (sentItems.length > 0) {
      const validIds = new Set(sentItems.map(i => String(i.id)));

      if (includeCollage) {
        const outfitMatch = raw.match(/\n?OUTFIT\s*:\s*(\{[^}]*\})\s*$/);
        if (outfitMatch) {
          try {
            const parsed = JSON.parse(outfitMatch[1]);
            if (parsed.itemIds && Array.isArray(parsed.itemIds)) {
              const ids = parsed.itemIds.map(String).filter(id => validIds.has(id));
              outfit = { outfitName: (parsed.outfitName || 'AI Outfit').slice(0, 40), itemIds: ids };
            }
          } catch {}
          raw = raw.slice(0, raw.length - outfitMatch[0].length).trimEnd();
        }
      } else {
        const refsMatch = raw.match(/\n?REFS\s*:\s*(\[[^\]]*\])\s*$/);
        if (refsMatch) {
          try {
            const ids = JSON.parse(refsMatch[1]);
            if (Array.isArray(ids)) {
              referencedItemIds = ids.map(String).filter(id => validIds.has(id));
            }
          } catch {}
          raw = raw.slice(0, raw.length - refsMatch[0].length).trimEnd();
        }
      }

      // Fallback: extract inline [ID:xxx] when model didn't output REFS/OUTFIT line
      if (referencedItemIds.length === 0 && !outfit) {
        const inlineIds = [...new Set(
          [...raw.matchAll(/\[ID:([^\]]+)\]/g)].map(m => String(m[1])).filter(id => validIds.has(id))
        )];
        if (inlineIds.length) referencedItemIds = inlineIds;
      }
    }

    // Strip [ID:xxx] tags from response text — they are internal and must not reach the user
    raw = raw.replace(/\s*\[ID:[^\]]+\]/g, '');

    await logAuditEvent({ event: 'stylist_call', userId: user.id, endpoint: '/api/ai-stylist', req, metadata: { includeWardrobe, includeCollage, messageCount: messages.length } });
    if (outfit) {
      await logAuditEvent({ event: 'stylist_collage', userId: user.id, endpoint: '/api/ai-stylist', req });
    }
    return res.status(200).json({
      reply: raw,
      referencedItemIds: sentItems.length > 0 ? referencedItemIds : undefined,
      outfit,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error('ai-stylist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
