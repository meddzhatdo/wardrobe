import { createClient } from '@supabase/supabase-js';

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
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { imageUrl, imageBase64, mediaType, name, brand, category, material, color } = req.body;

  if (!imageUrl && !imageBase64) return res.status(400).json({ error: 'imageUrl or imageBase64 is required' });

  const sanitize = (val, max) =>
    typeof val === 'string' ? val.replace(/[\r\n\t`]/g, ' ').slice(0, max).trim() : '';

  const safeName     = sanitize(name,     80)  || 'unknown';
  const safeBrand    = sanitize(brand,    50)  || 'unknown';
  const safeCategory = sanitize(category, 50)  || 'unknown';
  const safeMaterial = sanitize(material, 50)  || 'unknown';
  const safeColor    = sanitize(color,    50)  || 'unknown';

  const systemPrompt = `You are a fashion AI that returns structured JSON. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `Analyze this garment image and return a JSON object with exactly this shape:
{
  "attributes": {
    "warmthRating": "<none|light|warm|heavy>"
  }
}

Item context: "${safeName}" by ${safeBrand}, category: ${safeCategory}, material: ${safeMaterial}, color: ${safeColor}.

Rules for warmthRating:
- none: non-clothing items (shoes, bags, accessories, jewelry)
- light: thin or unlined fabrics (cotton tees, linen, light denim, summer dresses)
- warm: moderate warmth (knitwear, cardigans, lined blazers, wool trousers)
- heavy: insulated or padded outerwear (coats, puffer jackets, heavy wool coats)`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: imageBase64
                  ? { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
                  : { type: 'url', url: imageUrl },
              },
              { type: 'text', text: userPrompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return res.status(502).json({ error: 'Could not parse AI response' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error('enrich-item error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
