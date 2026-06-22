import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';
import { checkRateLimit } from './_rateLimit.js';

initSentry();

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

  // Build Gemini contents array from conversation history
  const contents = [];

  // If wardrobe context is requested, prepend a wardrobe summary as the first user turn
  if (includeWardrobe && items.length > 0) {
    const wardrobeLines = [];
    const visionParts = [];

    for (const item of items.slice(0, 12)) {
      const name = sanitize(item.name, 80) || 'unknown item';
      const category = sanitize(item.category, 50) || 'unknown';
      const color = sanitize(item.color, 40);
      const brand = sanitize(item.brand, 50);
      const desc = [name, category, color && `color: ${color}`, brand && `brand: ${brand}`].filter(Boolean).join(' | ');
      wardrobeLines.push(`- ${desc}`);

      if (item.image) {
        try {
          const imgRes = await fetch(item.image, { signal: AbortSignal.timeout(6000) });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            visionParts.push({ inlineData: { mimeType, data: base64 } });
          }
        } catch {}
      }
    }

    const country = sanitize(userProfile?.country, 30);
    const goals = Array.isArray(userProfile?.outfitGoals) ? userProfile.outfitGoals.join(', ') : '';
    const contextText =
      `Here is the user's wardrobe (${items.length} items total, showing up to 12):\n${wardrobeLines.join('\n')}` +
      (country ? `\nUser is based in: ${country}` : '') +
      (goals ? `\nStyle goals: ${goals}` : '') +
      '\n\nPlease use this wardrobe context to answer their question.';

    contents.push({
      role: 'user',
      parts: [...visionParts, { text: contextText }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: "Got it — I've reviewed your wardrobe. What would you like to know?" }],
    });
  }

  // Append conversation history
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: sanitize(msg.content, 2000) }] });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Stylist API key not configured.' });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_API}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 600, temperature: 0.85 },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!reply) return res.status(502).json({ error: 'Empty response from AI' });

    await logAuditEvent({ event: 'stylist_call', userId: user.id, endpoint: '/api/ai-stylist', req, metadata: { includeWardrobe, messageCount: messages.length } });
    return res.status(200).json({ reply });
  } catch (err) {
    Sentry.captureException(err);
    console.error('ai-stylist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
