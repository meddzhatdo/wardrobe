import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from './_audit.js';
import { initSentry, Sentry } from './_sentry.js';
import { checkRateLimit } from './_rateLimit.js';

initSentry();

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
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { limited } = await checkRateLimit({ userId: user.id, endpoint: '/api/scrape-item', maxRequests: 30, windowMinutes: 60 });
  if (limited) return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const pageRes = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });

    const html = await pageRes.text();
    // Still try to parse on non-200 — some sites return usable HTML even on 403
    if (!pageRes.ok && html.length < 500) {
      return res.status(502).json({ error: `Could not fetch that page (${pageRes.status})` });
    }

    // Extract <meta> tag by property or name
    const getMeta = prop => {
      const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
      const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
      return (a?.[1] || b?.[1])?.trim() || null;
    };

    const images = new Set();
    const addImg = src => {
      if (!src || src.startsWith('data:')) return;
      try {
        const abs = new URL(src, parsedUrl.href).href;
        if (abs.startsWith('http')) images.add(abs);
      } catch {}
    };

    addImg(getMeta('og:image'));
    addImg(getMeta('og:image:url'));
    addImg(getMeta('twitter:image'));
    addImg(getMeta('twitter:image:src'));

    // JSON-LD product schema
    let name = '', brand = '', price = '', material = '', size = '';
    const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of ldBlocks) {
      try {
        const findProduct = obj => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj['@type'] === 'Product') return obj;
          if (Array.isArray(obj)) { for (const o of obj) { const r = findProduct(o); if (r) return r; } }
          for (const v of Object.values(obj)) { const r = findProduct(v); if (r) return r; }
          return null;
        };
        const product = findProduct(JSON.parse(m[1]));
        if (!product) continue;

        if (!name && product.name)   name  = String(product.name).slice(0, 120);
        if (!brand && product.brand) brand = (typeof product.brand === 'string' ? product.brand : product.brand?.name || '').slice(0, 80);
        if (!material && product.material) material = String(product.material).slice(0, 100);

        // additionalProperty: Farfetch and others store "Composition" here
        if (!material && product.additionalProperty) {
          const props = Array.isArray(product.additionalProperty) ? product.additionalProperty : [product.additionalProperty];
          const comp = props.find(p => /^(?:composition|material|fabric|fiber|content)$/i.test(String(p?.name || '').trim()));
          if (comp?.value) material = String(comp.value).slice(0, 100);
        }

        if (!price && product.offers) {
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          if (offer?.price != null) price = String(offer.price);
        }
        const imgList = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
        for (const img of imgList) addImg(typeof img === 'string' ? img : img?.url);
      } catch {}
    }

    // Price fallbacks: standard e-commerce meta tags many sites set independently of JSON-LD
    if (!price) price = getMeta('product:price:amount') || getMeta('og:price:amount') || '';
    if (!price) {
      // Twitter card price: <meta name="twitter:label1" content="Price"> + <meta name="twitter:data1" content="$120">
      const label1 = getMeta('twitter:label1') || '';
      const label2 = getMeta('twitter:label2') || '';
      if (/price/i.test(label1)) price = getMeta('twitter:data1') || '';
      else if (/price/i.test(label2)) price = getMeta('twitter:data2') || '';
    }
    if (!price) {
      // Schema.org microdata: <span itemprop="price" content="120.00"> or <meta itemprop="price" content="120">
      const m = html.match(/itemprop=["']price["'][^>]+content=["']([^"']+)["']/i)
             || html.match(/content=["']([^"']+)["'][^>]+itemprop=["']price["']/i);
      if (m) price = m[1].trim();
    }
    // Strip currency symbols so only the numeric value goes into the price field
    price = price.replace(/^[^0-9]*/, '').trim();

    if (!name) name = (getMeta('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim().slice(0, 120);

    // Clean name: strip trailing segments after | – — separators (site names, size codes, color variants)
    // Iterate up to 3 times to handle "Name | L | Farfetch" → "Name | L" → "Name"
    for (let i = 0; i < 3; i++) {
      const cleaned = name.replace(/\s*[|–—]\s*[^|–—]{1,50}$/, '').trim();
      if (cleaned === name || cleaned.length < 3) break;
      name = cleaned;
    }

    // Material: prefer percentage composition ("100% silk") over bare fabric words
    if (!material) {
      const desc = getMeta('og:description') || getMeta('description') || '';
      const pctMatch = desc.match(/\b(\d+\s*%\s*\w+(?:[,\s&+]+\d+\s*%\s*\w+)*)/i);
      const wordMatch = desc.match(/\b(silk|cotton|linen|wool|cashmere|polyester|nylon|leather|suede|denim|satin|velvet|chiffon|georgette|rayon|viscose|bamboo|lyocell|tencel|modal|alpaca|mohair|angora)\b/i);
      const hit = pctMatch?.[1] || wordMatch?.[1] || '';
      if (hit) material = hit.charAt(0).toUpperCase() + hit.slice(1);
    }
    // Last resort: scan raw HTML for "Composition: 100% silk" or "Material: cotton" labels
    if (!material) {
      const m = html.match(/\b(?:composition|material|fabric)\b[^:]{0,10}:\s*([^<\n"]{5,80})/i);
      if (m) material = m[1].replace(/\s+/g, ' ').trim().slice(0, 100);
    }

    // Supplemental <img> tags — heuristic: no logo/icon/avatar, must be a real URL
    const imgTags = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
    for (const m of imgTags) {
      const src = m[1];
      if (/logo|icon|avatar|sprite|pixel|tracking|beacon/i.test(src)) continue;
      addImg(src);
      if (images.size >= 20) break;
    }

    await logAuditEvent({ event: 'scrape_item', userId: user.id, endpoint: '/api/scrape-item', req, metadata: { host: parsedUrl.hostname } });

    return res.status(200).json({ images: [...images].slice(0, 16), name, brand, price, material, size });
  } catch (err) {
    Sentry.captureException(err);
    console.error('scrape-item error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
