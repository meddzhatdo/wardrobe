import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';

initSentry();

const OUTFIT_GOALS = [
  { id: 'workwear', label: 'Workwear' },
  { id: 'casual',   label: 'Casual day-looks' },
  { id: 'night',    label: 'Night looks' },
  { id: 'anything', label: "I'm up for anything!" },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://wardrobe-app.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    await logAuditEvent({ event: 'auth_failure', endpoint: '/api/generate-outfits', req });
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { weather, items, userProfile } = req.body;
  if (!weather || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'weather and items are required' });
  }

  // Build vision content blocks server-side — key never leaves the server
  const content = [];
  for (const item of items) {
    if (item.image) {
      try {
        const imgRes = await fetch(item.image);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mediaType = imgRes.headers.get('content-type') || 'image/jpeg';
          content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
        }
      } catch {}
    }
    content.push({ type: 'text', text: `[ID:${item.id}] ${item.name} | Category: ${item.category}` });
  }

  const goalLabels = (userProfile?.outfitGoals || [])
    .map(id => OUTFIT_GOALS.find(g => g.id === id)?.label)
    .filter(Boolean);

  content.push({
    type: 'text',
    text:
      `Weather: ${weather.tempF}°F now (${weather.conditionLabel}), High ${weather.highF}°F / Low ${weather.lowF}°F` +
      (weather.laterCondition ? `, with ${weather.laterCondition} expected later today` : '') + `.\n` +
      (goalLabels.length ? `\nThe user wants outfits suited for: ${goalLabels.join(', ')}. Tailor the suggestions to match these contexts.\n` : '') + `\n` +
      `Using the garment images above, generate exactly 3 distinct, cohesive outfits. Hard rules:\n` +
      `1. TOPS: Every outfit must include a "Tops" or "Knitwear & Sweaters" item UNLESS it contains a "Dresses & Jumpsuits" item. Never omit a top.\n` +
      `2. BOTTOMS: Every outfit must include one "Bottoms" item UNLESS it contains a "Dresses & Jumpsuits" item. NEVER combine two bottoms (e.g., jeans + skirt is invalid — pick one).\n` +
      `3. SHOES: Every outfit must include exactly one "Shoes" item.\n` +
      `4. ACCESSORIES: "Accessories & Bags" and "Jewelry" items are optional but encouraged when they complement the look visually. You may include one or two per outfit.\n` +
      `5. LAYERING: Below 50°F, pair short-sleeve or base-layer tops with an "Outerwear" item.\n` +
      `6. OUTERWEAR WEIGHT: Above 65°F include no outerwear or only a very light jacket. Between 50–65°F a medium jacket or blazer is appropriate — avoid heavy coats, shearling, or thick parkas. Below 50°F heavier coats are suitable. Below 32°F heavy outerwear is expected.\n` +
      `7. DISTINCT: No two outfits may share the exact same item set.\n` +
      `If an outfit is not fully weather-appropriate, the "description" field may include a brief practical recommendation.\n` +
      `The "description" field must be no more than 200 characters.\n` +
      `Return ONLY a raw JSON array of exactly 3 objects: ` +
      `[{"outfitName":"...","description":"...","itemIds":["id1","id2",...]}]`,
  });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: "You are a professional fashion stylist with visual and cultural expertise. Visually inspect the attached garment images — study their actual colors, fabrics, textures, and silhouettes. Build outfits that are visually cohesive, ensure patterns do not clash and colors harmonize. Respond with valid raw JSON only — no markdown fences, no commentary.",
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', await anthropicRes.text());
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await anthropicRes.json();
    let raw = data.content?.[0]?.text ?? '';
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return res.status(502).json({ error: 'Invalid AI response' });

    await logAuditEvent({ event: 'ai_call', userId: user.id, endpoint: '/api/generate-outfits', req, metadata: { model: 'claude-sonnet-4-6', item_count: items.length } });
    return res.status(200).json(parsed);
  } catch (err) {
    Sentry.captureException(err);
    console.error('generate-outfits error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
