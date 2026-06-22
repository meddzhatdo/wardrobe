import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';
import { checkRateLimit } from './_rateLimit.js';
import { safeFetch, BLOCKED } from './_safeFetch.js';

initSentry();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://wardrobe-app.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { limited } = await checkRateLimit({ userId: user.id, endpoint: '/api/proxy-image', maxRequests: 120, windowMinutes: 60, event: 'proxy_image' });
  if (limited) return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    if (BLOCKED.test(parsedUrl.hostname)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const imgRes = await safeFetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WardrobeApp/1.0)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!imgRes.ok) return res.status(502).json({ error: 'Could not fetch image' });

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return res.status(400).json({ error: 'URL is not an image' });

    const buffer = await imgRes.arrayBuffer();
    if (buffer.byteLength > 20 * 1024 * 1024) return res.status(413).json({ error: 'Image too large' });

    await logAuditEvent({ event: 'proxy_image', userId: user.id, endpoint: '/api/proxy-image', req });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(Buffer.from(buffer));
  } catch (err) {
    Sentry.captureException(err);
    console.error('proxy-image error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
