import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';
import { checkRateLimit } from './_rateLimit.js';

initSentry();

const SYSTEM_PROMPT = `You are a knowledgeable, friendly personal stylist. You give concise, practical style advice.
When the user shares their wardrobe items, reference them specifically by name or description.
Keep responses conversational and under 300 words unless a detailed breakdown is genuinely needed.
Do not use excessive bullet points — prefer flowing sentences. Never mention that you are an AI.`;

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

  const { messages, includeWardrobe, items = [], userProfile = {} } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const sanitize = (val, max) =>
    typeof val === 'string' ? val.replace(/[\r\n\t`]/g, ' ').slice(0, max).trim() : '';

  // Build the content blocks for the API call
  const content = [];

  // If wardrobe context is requested, prepend a wardrobe summary + item images
  if (includeWardrobe && items.length > 0) {
    const wardrobeLines = [];

    for (const item of items.slice(0, 12)) {
      const name     = sanitize(item.name,     80) || 'unknown item';
      const category = sanitize(item.category, 50) || 'unknown';
      const color    = sanitize(item.color,    40);
      const brand    = sanitize(item.brand,    50);
      const desc     = [name, category, color && `color: ${color}`, brand && `brand: ${brand}`].filter(Boolean).join(' | ');
      wardrobeLines.push(`- ${desc}`);

      if (item.image) {
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
    const goals   = Array.isArray(userProfile?.outfitGoals) ? userProfile.outfitGoals.join(', ') : '';
    content.push({
      type: 'text',
      text:
        `Here is the user's wardrobe (${items.length} items total, showing up to 12):\n${wardrobeLines.join('\n')}` +
        (country ? `\nUser is based in: ${country}` : '') +
        (goals   ? `\nStyle goals: ${goals}`         : '') +
        '\n\nPlease use this wardrobe context to answer their question.',
    });
  }

  // Append full conversation history as a single user block + prior assistant replies
  // Anthropic expects alternating user/assistant messages
  const anthropicMessages = [];

  if (content.length > 0) {
    // Wardrobe context goes in as the first user message
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
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', await anthropicRes.text());
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data  = await anthropicRes.json();
    const reply = data.content?.[0]?.text ?? '';
    if (!reply) return res.status(502).json({ error: 'Empty response from AI' });

    await logAuditEvent({ event: 'stylist_call', userId: user.id, endpoint: '/api/ai-stylist', req, metadata: { includeWardrobe, messageCount: messages.length } });
    return res.status(200).json({ reply });
  } catch (err) {
    Sentry.captureException(err);
    console.error('ai-stylist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
