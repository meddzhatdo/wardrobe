import React, { useState, useEffect } from 'react';
import { Cloud, Sparkles, Shirt } from 'lucide-react';

const OUTFIT_CATEGORIES = new Set([
  'Tops', 'Bottoms', 'Dresses & Jumpsuits',
  'Outerwear', 'Knitwear & Sweaters',
  'Shoes', 'Activewear / Athleisure',
  'Accessories & Bags', 'Jewelry',
]);

// Stage 1: rule-based filter → pool of ≤30 weather-appropriate items
export function buildWeatherPool(weather, allItems) {
  let pool = allItems.filter(i => OUTFIT_CATEGORIES.has(i.category));

  if (weather.tempF > 75) {
    // Hot: no heavy items at all
    pool = pool.filter(i => i.attributes?.warmthRating !== 'heavy');
  } else if (weather.tempF > 65) {
    // Warm: heavy non-outerwear (thick knitwear, etc.) is too warm; light outerwear ok
    pool = pool.filter(i =>
      i.category === 'Outerwear' || i.attributes?.warmthRating !== 'heavy'
    );
  } else if (weather.tempF > 50) {
    // Cool/comfortable: heavy outerwear (shearling, heavy parkas) is overkill
    pool = pool.filter(i =>
      i.category !== 'Outerwear' || i.attributes?.warmthRating !== 'heavy'
    );
  } else if (weather.tempF < 40) {
    // Cold: surface warmer items first; unrated items are included after rated ones
    const warm    = pool.filter(i => ['heavy', 'warm', 'medium'].includes(i.attributes?.warmthRating));
    const unrated = pool.filter(i => !i.attributes?.warmthRating);
    const light   = pool.filter(i => i.attributes?.warmthRating === 'light');
    pool = [...warm, ...unrated, ...light];
  }

  // Stratified sample so all outfit roles are represented
  const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  const tops        = pool.filter(i => ['Tops', 'Dresses & Jumpsuits', 'Knitwear & Sweaters', 'Activewear / Athleisure'].includes(i.category));
  const bottoms     = pool.filter(i => i.category === 'Bottoms');
  const shoes       = pool.filter(i => i.category === 'Shoes');
  const outer       = pool.filter(i => i.category === 'Outerwear');
  const accessories = pool.filter(i => ['Accessories & Bags', 'Jewelry'].includes(i.category));

  const candidates = [
    ...pick(tops,        10),
    ...pick(bottoms,      6),
    ...pick(shoes,        5),
    ...pick(outer,        4),
    ...pick(accessories,  5),
  ];

  const seen = new Set();
  const final = [];
  for (const item of candidates) {
    if (!seen.has(item.id) && final.length < 30) {
      seen.add(item.id);
      final.push(item);
    }
  }
  return final;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Content-aware image trimming — used in Studio canvas to give each item a
   bounding box that matches the actual garment shape, not the full image square.
   ───────────────────────────────────────────────────────────────────────────── */

export const _trimCache = new Map();

export function computeImageTrim(src) {
  if (_trimCache.has(src)) return Promise.resolve(_trimCache.get(src));
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const nw = img.naturalWidth, nh = img.naturalHeight;
      try {
        const S = 128;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, S, S);
        const { data } = ctx.getImageData(0, 0, S, S);
        let x0 = S, y0 = S, x1 = -1, y1 = -1;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          if (data[(y * S + x) * 4 + 3] > 10) {
            if (x < x0) x0 = x; if (y < y0) y0 = y;
            if (x > x1) x1 = x; if (y > y1) y1 = y;
          }
        }
        const t = x1 >= 0
          ? { fx: x0/S, fy: y0/S, fw: (x1-x0+1)/S, fh: (y1-y0+1)/S, nw, nh }
          : null;
        _trimCache.set(src, t); resolve(t);
      } catch { _trimCache.set(src, null); resolve(null); }
    };
    img.onerror = () => { _trimCache.set(src, null); resolve(null); };
    img.src = src;
  });
}

// Returns the canvas bounding-box size for an item given its trim data.
// Uses actual pixel dimensions (nw/nh) so portrait/landscape images get the right AR.
export function contentBounds(trim, maxSize) {
  if (!trim) return { w: maxSize, h: maxSize };
  const { fw, fh, nw, nh } = trim;
  if (nw && nh) {
    const cw = fw * nw, ch = fh * nh;
    const scale = maxSize / Math.max(cw, ch);
    return { w: Math.max(1, Math.round(cw * scale)), h: Math.max(1, Math.round(ch * scale)) };
  }
  return { w: Math.max(1, Math.round(fw * maxSize)), h: Math.max(1, Math.round(fh * maxSize)) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   OutfitCollage — flat-lay collage with head-to-toe body ordering
   z-layers: outerwear(1) → bottoms(2) → tops/shoes(3) → accessories(4)
   ───────────────────────────────────────────────────────────────────────────── */

// cx/cy = center of slot in a 510×720 canvas (A4 ratio, page-filling)
// w/h   = item image size
// z     = stacking layer (1=outerwear, 2=bottoms, 3=tops/shoes, 4=accessories)
// sx/sy = per-item stagger when >1 item shares a slot
// All bounding boxes kept ≥14px from canvas edges (510×720).
// Product images carry ~20% transparent padding — tops/bottoms bounding boxes are spaced
// so their visible garments have a small gap rather than overlapping.
// 1000×1000 unit design grid — safe zone 50–950 on both axes.
// Z hierarchy: 1=Bottoms, 2=Tops/Dresses, 3=Outerwear, 4=Shoes/Accessories/Jewelry.
// sx/sy = per-additional-item offset (spread) when multiple items share a category.
export const LAYOUT_CONFIG = {
  // Level 1 — Outerwear (left side; visible alongside tops/bottoms)
  'Outerwear':               { cx: 215, cy: 450, w: 460, h: 550, z: 1, sx: 28, sy: 10 },
  // Level 2 — Bottoms (lower center; sits above outerwear)
  'Bottoms':                 { cx: 500, cy: 625, w: 480, h: 550, z: 2, sx: 28, sy: 10 },
  // Level 3 — Tops / full-length garments (upper center; proportional to Bottoms)
  'Tops':                    { cx: 500, cy: 265, w: 320, h: 345, z: 3, sx: 22, sy:  8 },
  'Knitwear & Sweaters':     { cx: 500, cy: 265, w: 320, h: 345, z: 3, sx: 22, sy:  8 },
  'Dresses & Jumpsuits':     { cx: 500, cy: 450, w: 415, h: 875, z: 3, sx: 26, sy: 10 },
  'Activewear / Athleisure': { cx: 500, cy: 450, w: 415, h: 735, z: 3, sx: 26, sy: 10 },
  // Level 4 — Accents (shoes left-bottom, bags right-mid, jewelry top-right)
  'Shoes':                   { cx: 345, cy: 862, w: 275, h: 190, z: 4, sx: 72, sy: 10 },
  'Accessories & Bags':      {
    cx: 762, cy: 490, w: 295, h: 295, z: 4, sx: 18, sy: 58, max: 2,
    // Explicit per-slot positions: 1st middle-right, 2nd bottom-right (no overlap)
    slots: [
      { cx: 762, cy: 490 },
      { cx: 820, cy: 790 },
    ],
  },
  'Jewelry':                 { cx: 762, cy: 195, w: 202, h: 202, z: 4, sx: 28, sy: 28 },
};

// Design-space dimensions (coordinate grid)
export const DESIGN_W = 1000;
export const DESIGN_H = 1000;
// vertical space consumed by the TodayTab header (title + padding + gap)
export const COLLAGE_HEADER_OFFSET = 172;

// Converts AI outfit items into design-space (1000×1000) canvas items.
// CreateOutfitModal scales them to the actual canvas size on mount via initialDesignWidth/Height.
export function aiOutfitToCanvasItems(outfitItems) {
  const groups = {};
  for (const item of outfitItems) {
    const slot = LAYOUT_CONFIG[item.category];
    if (!slot) continue;
    (groups[item.category] ??= []).push(item);
  }
  const canvasItems = [];
  for (const [cat, catItems] of Object.entries(groups)) {
    const { cx, cy, w, h, z, sx, sy, slots, max } = LAYOUT_CONFIG[cat];
    const limited = max ? catItems.slice(0, max) : catItems;
    const n = limited.length;
    limited.forEach((item, i) => {
      let x, y;
      if (slots && slots[i] !== undefined) {
        x = Math.round(slots[i].cx - w / 2);
        y = Math.round(slots[i].cy - h / 2);
      } else {
        const offset = i - (n - 1) / 2;
        x = Math.round(cx + offset * sx - w / 2);
        y = Math.round(cy + offset * sy - h / 2);
      }
      canvasItems.push({
        ...item,
        _cid:      `${item.id}-${Date.now()}-${i}`,
        x, y, w, h,
        rotation:  0,
        zIndex:    z,
        _aiLayout: true, // box sized from LAYOUT_CONFIG (non-uniform A4 scale); skip canCrop in editor
      });
    });
  }
  return canvasItems;
}

export function FadeIn({ children, className = '' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`transition-all duration-500 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}>
      {children}
    </div>
  );
}

export function GeneratingSkeleton({ city, weatherSummary }) {
  const phase = !weatherSummary ? 'weather' : 'outfits';
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 animate-pulse">
        {phase === 'weather'
          ? <Cloud size={24} className="text-gray-300" />
          : <Sparkles size={24} className="text-gray-300" />}
      </div>
      <p className="text-[15px] font-semibold text-gray-700 mb-1.5">
        {phase === 'weather' ? 'Checking the weather…' : 'Styling your day…'}
      </p>
      <p className="text-sm text-gray-400 leading-relaxed max-w-[210px]">
        {phase === 'weather'
          ? (city ? `Looking up conditions in ${city}` : 'Fetching your local weather')
          : (city ? `Picking outfits for ${city}'s weather today` : 'Crafting your daily looks')}
      </p>
    </div>
  );
}

export function useCollageScale() {
  const calc = () => {
    const byHeight = Math.min(1, (window.innerHeight - COLLAGE_HEADER_OFFSET) / DESIGN_H);
    // Cap by available width so collage never overflows the screen in column layout.
    // displayW = DESIGN_H * scale * (210/297), so byWidth = (screenW - hPad) / (DESIGN_H * 210/297)
    const byWidth = (window.innerWidth - 48) / (DESIGN_H * (210 / 297));
    return Math.min(byHeight, byWidth, 1);
  };
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const update = () => setScale(calc());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

export function OutfitCollage({ items, fixedScale }) {
  const dynamicScale = useCollageScale();
  const scale = fixedScale ?? dynamicScale;

  const groups = {};
  for (const item of items) {
    const slot = LAYOUT_CONFIG[item.category];
    if (!slot) continue;
    (groups[item.category] ??= []).push(item);
  }

  const placed = [];
  for (const [cat, catItems] of Object.entries(groups)) {
    const slot = LAYOUT_CONFIG[cat];
    const { cx, cy, w, h, z, sx: dsx, sy: dsy, slots, max } = slot;
    const limited = max ? catItems.slice(0, max) : catItems;
    const n = limited.length;
    limited.forEach((item, i) => {
      let left, top;
      if (slots && slots[i] !== undefined) {
        left = Math.round(slots[i].cx - w / 2);
        top  = Math.round(slots[i].cy - h / 2);
      } else {
        const offset = i - (n - 1) / 2;
        left = Math.round(cx + offset * dsx - w / 2);
        top  = Math.round(cy + offset * dsy - h / 2);
      }
      placed.push({ item, left, top, w, h, z });
    });
  }

  placed.sort((a, b) => a.z - b.z);

  // A4 portrait display — non-uniform scale so Today and Studio look identical
  const displayH = Math.round(DESIGN_H * scale);
  const displayW = Math.round(displayH * 210 / 297);
  const scaleX   = displayW / DESIGN_W;
  const scaleY   = displayH / DESIGN_H;

  return (
    <div
      className="flex-shrink-0 rounded-3xl bg-gray-50 overflow-hidden relative"
      style={{ width: displayW, height: displayH }}
    >
      {placed.map(({ item, left, top, w, h, z }) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left:   Math.round(left * scaleX),
            top:    Math.round(top  * scaleY),
            width:  Math.round(w    * scaleX),
            height: Math.round(h    * scaleY),
            zIndex: z,
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
              <Shirt size={20} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// v3: array of { date, city, outfits } — keyed by city + date so forecast drift never triggers regen
export const OUTFITS_CACHE_KEY = 'wardrobe_daily_outfits_v3';

export function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function loadCachedOutfits(city) {
  try {
    const raw = localStorage.getItem(OUTFITS_CACHE_KEY);
    if (!raw) return null;
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return null;
    const entry = entries.find(e => e.date === todayDateKey() && e.city === city);
    return entry?.outfits ?? null;
  } catch { return null; }
}

export function saveCachedOutfits(outfits, city) {
  try {
    const raw = localStorage.getItem(OUTFITS_CACHE_KEY);
    let entries = [];
    try { const p = JSON.parse(raw); if (Array.isArray(p)) entries = p; } catch {}
    const today = todayDateKey();
    // Replace existing entry for same city, drop stale dates
    entries = entries.filter(e => e.date === today && e.city !== city);
    entries.push({ date: today, city, outfits });
    localStorage.setItem(OUTFITS_CACHE_KEY, JSON.stringify(entries));
  } catch {}
}

export const PRECIP_LABELS = new Set(['Drizzle', 'Rain', 'Snow', 'Showers', 'Snow Showers', 'Thunderstorm']);
export function hasPrecip(label) { return PRECIP_LABELS.has(label); }
