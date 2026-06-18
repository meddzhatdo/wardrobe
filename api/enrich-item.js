export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageUrl, name, brand, category, material, color } = req.body;

  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  const systemPrompt = `You are a fashion AI that returns structured JSON describing a garment's attributes and color profile. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `Analyze this garment image and return a JSON object with exactly this shape:
{
  "attributes": {
    "layerType": "<base|mid|outer|none>",
    "sleeveLength": "<none|short|long>",
    "warmthRating": "<none|light|warm|heavy>"
  },
  "colorProfile": {
    "primaryHex": "<dominant color as hex e.g. #C8B89A>",
    "colorFamily": "<single-word family e.g. Neutral, Blue, Brown, Pink, Green, Red, Black, White>",
    "undertone": "<Warm|Cool|Neutral>",
    "vibrancy": "<Vibrant|Pastel|Muted|Deep>"
  }
}

Item context: "${name ?? ''}" by ${brand ?? 'unknown'}, category: ${category ?? 'unknown'}, material: ${material ?? 'unknown'}, color name: ${color ?? 'unknown'}.

Rules:
- layerType: base=closest to skin (tees, tanks, shirts, blouses), mid=worn over base (sweaters, blazers, cardigans), outer=outermost (coats, jackets, trench), none=non-clothing (shoes, bags, accessories, jewelry)
- sleeveLength: none=sleeveless or non-clothing, short=short/cap/3-quarter sleeves, long=full-length sleeves
- warmthRating: none=non-clothing, light=thin/unlined fabric, warm=moderate warmth (knitwear, lined blazers), heavy=insulated/padded/wool coats
- primaryHex: the most dominant visible color in the image as a hex code
- colorFamily: broadest color name (e.g. Neutral for beige/tan/grey/white/black, Blue, Brown, Pink, Green, Red, Yellow, Purple, Orange)
- undertone: Warm=yellow/orange/red base, Cool=blue/green/purple base, Neutral=balanced
- vibrancy: Vibrant=bright/saturated, Pastel=light/soft/diluted, Muted=grey-washed/desaturated, Deep=dark/rich`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return res.status(502).json({ error: 'Claude API error', detail: err });
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
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
