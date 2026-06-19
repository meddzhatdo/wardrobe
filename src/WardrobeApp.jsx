/**
 * WardrobeApp.jsx
 * Phase 1 — UI Layout + Mock Data
 * Stack: React · Tailwind CSS · Lucide React
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Shirt, Wand2, Sparkles,
  X, Heart, Plus, Search, ChevronRight, Pencil, Trash2, Brush, Check, Layers, Lock, GripVertical, MoreHorizontal,
  Undo2, Redo2, Loader2, ImageIcon, Camera, User, LogOut, Download, Eraser, MapPin,
  Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog,
} from 'lucide-react';
import { supabase } from './supabase.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Global Styles (injected once into <head>)
   ───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  /* Hide scrollbars while keeping scroll behaviour */
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  /* Modal slide-up (mobile) */
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  /* Modal fade-scale-in (desktop) */
  @keyframes fadeScaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  /* Backdrop */
  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal-animate   { animation: slideUp     0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
  .backdrop-fade   { animation: backdropIn  0.2s ease forwards; }

  @media (min-width: 768px) {
    .modal-animate { animation: fadeScaleIn 0.2s ease-out forwards; }
  }

  /* Location badge transitions */
  .loc-pill  { transition: max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; }
  .loc-input { transition: max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Data
   ───────────────────────────────────────────────────────────────────────────── */
const BOARDS = ['All', 'Workwear', 'Weekend', 'Evening', 'Basics', 'Outerwear'];

const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses & Jumpsuits',
  'Outerwear',
  'Knitwear & Sweaters',
  'Shoes',
  'Activewear / Athleisure',
  'Accessories & Bags',
  'Jewelry',
  'Underwear & Sleepwear',
  'Other',
];

const ITEMS = [
  {
    id: 1,
    name: 'Oversized Linen Blazer',
    brand: 'Theory',
    price: '$485',
    material: '100% Belgian Linen',
    category: 'Outerwear',
    boards: ['Workwear', 'Weekend'],
    color: 'Sand',
    size: 'S / 36',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#C8B89A', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 2,
    name: 'Silk Slip Dress',
    brand: 'Reformation',
    price: '$248',
    material: '100% Silk Charmeuse',
    category: 'Dresses',
    boards: ['Evening'],
    color: 'Ivory',
    size: 'XS',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5F0E8', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 3,
    name: 'Achilles Low Sneaker',
    brand: 'Common Projects',
    price: '$495',
    material: 'Full-grain Leather',
    category: 'Footwear',
    boards: ['Weekend', 'Basics'],
    color: 'White',
    size: '38',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#FFFFFF', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Muted' },
  },
  {
    id: 4,
    name: 'Cashmere Turtleneck',
    brand: 'Everlane',
    price: '$175',
    material: 'Grade-A Mongolian Cashmere',
    category: 'Tops',
    boards: ['Basics', 'Weekend'],
    color: 'Camel',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#C19A6B', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 5,
    name: '90s Pinch Jeans',
    brand: 'AGOLDE',
    price: '$228',
    material: '100% Organic Cotton Denim',
    category: 'Bottoms',
    boards: ['Weekend', 'Basics'],
    color: 'Light Indigo',
    size: '26',
    image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#7B93B4', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Muted' },
  },
  {
    id: 6,
    name: 'Westminster Trench',
    brand: 'Burberry',
    price: '$2,290',
    material: 'Cotton Gabardine',
    category: 'Outerwear',
    boards: ['Outerwear', 'Workwear', 'Weekend'],
    color: 'Honey',
    size: 'UK 8',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#C8922A', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 7,
    name: 'Numéro Un Tote',
    brand: 'Polène',
    price: '$360',
    material: 'Suede Leather',
    category: 'Bags',
    boards: ['Weekend', 'Workwear'],
    color: 'Caramel',
    size: 'OS',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#B5733B', colorFamily: 'Brown', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 8,
    name: 'Ribbed Modal Tank',
    brand: 'Toteme',
    price: '$120',
    material: '90% Modal, 10% Elastane',
    category: 'Tops',
    boards: ['Basics', 'Weekend'],
    color: 'Off White',
    size: 'XS / S',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b02e0?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F2EDE4', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 9,
    name: 'Fluid Wide-Leg Trouser',
    brand: 'COS',
    price: '$155',
    material: '65% Viscose, 35% Linen',
    category: 'Bottoms',
    boards: ['Workwear'],
    color: 'Stone',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#A89880', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Muted' },
  },
  {
    id: 10,
    name: 'Nappa Ankle Boot',
    brand: 'ATP Atelier',
    price: '$380',
    material: 'Vegetable-tanned Nappa',
    category: 'Footwear',
    boards: ['Evening', 'Weekend'],
    color: 'Cognac',
    size: '38',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#8B4513', colorFamily: 'Brown', undertone: 'Warm', vibrancy: 'Deep' },
  },
  {
    id: 11,
    name: 'Linen Popover Shirt',
    brand: 'Uniqlo',
    price: '$39.90',
    material: '100% French Linen',
    category: 'Tops',
    boards: ['Basics', 'Weekend'],
    color: 'White',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#FAFAFA', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Muted' },
  },
  {
    id: 12,
    name: '101801 Camel Coat',
    brand: 'Max Mara',
    price: '$1,840',
    material: 'Camel Hair & Wool Blend',
    category: 'Outerwear',
    boards: ['Outerwear', 'Workwear'],
    color: 'Camel',
    size: '38 IT',
    image: 'https://images.unsplash.com/photo-1583744946564-b432d563933f?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'heavy' },
    colorProfile: { primaryHex: '#C19A6B', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 13,
    name: 'Pleated Satin Skirt',
    brand: 'Sandro',
    price: '$295',
    material: '100% Polyester Satin',
    category: 'Bottoms',
    boards: ['Evening'],
    color: 'Champagne',
    size: '36 FR',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5974ca5f59?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#E8D5A3', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 14,
    name: 'Tailored City Blazer',
    brand: 'Zara',
    price: '$99.90',
    material: 'Polyester Blend',
    category: 'Outerwear',
    boards: ['Workwear'],
    color: 'Black',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 15,
    name: 'Chunky Knit Sweater',
    brand: 'Arket',
    price: '$169',
    material: '100% Lambswool',
    category: 'Tops',
    boards: ['Basics', 'Weekend'],
    color: 'Oatmeal',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: true,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#D4C5A9', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 16,
    name: 'Floral Chiffon Gown',
    brand: 'Self-Portrait',
    price: '$560',
    material: 'Silk Chiffon & Lace',
    category: 'Dresses',
    boards: ['Evening'],
    color: 'Floral Multi',
    size: 'US 6',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'short', warmthRating: 'light' },
    colorProfile: { primaryHex: '#E8B4C8', colorFamily: 'Pink', undertone: 'Cool', vibrancy: 'Pastel' },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Nav config
   ───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'today',    label: 'Today',      Icon: Sun      },
  { id: 'wardrobe', label: 'Wardrobe',   Icon: Shirt    },
  { id: 'studio',   label: 'Studio',     Icon: Wand2    },
  { id: 'stylist',  label: 'AI Stylist', Icon: Sparkles },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */
const RATIO = {
  tall:     'aspect-[2/3]',
  portrait: 'aspect-[3/4]',
  square:   'aspect-square',
};

function countByBoard(items, board) {
  return board === 'All' ? items.length : items.filter(i => i.boards.includes(board)).length;
}

/* ─────────────────────────────────────────────────────────────────────────────
   AddToCollageModal
   ───────────────────────────────────────────────────────────────────────────── */
function AddToCollageModal({ savedOutfits, draftOutfits, onClose, onCreateNew, onOpenCollage }) {
  const [view, setView] = useState('saved');
  const list = view === 'saved' ? savedOutfits : draftOutfits;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm modal-animate">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-900">Add to Collage</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Toggle */}
        <div className="px-5 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
            {[
              { key: 'saved',  label: 'Published',  count: savedOutfits.length },
              { key: 'drafts', label: 'Drafts', count: draftOutfits.length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {count > 0 && <span className="text-[11px] tabular-nums text-gray-400">{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Collage thumbnails */}
        <div className="px-5 pb-2 min-h-[6rem]">
          {list.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">
                {view === 'saved' ? 'No published collages yet' : 'No drafts yet'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
              {list.map(outfit => {
                const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
                const thumbBg = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
                return (
                  <div
                    key={outfit.id}
                    onClick={() => onOpenCollage(outfit, view)}
                    className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{ width: 68, height: 96, ...thumbBg }}
                  >
                    {items.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wand2 size={16} className="text-gray-300" />
                      </div>
                    ) : items.map((item, idx) => {
                      const w = item.w ?? 128;
                      const h = item.h ?? 128;
                      const rot = item.rotation ?? 0;
                      return (
                        <div
                          key={item._cid ?? idx}
                          style={{
                            position: 'absolute',
                            left: `${(item.x / canvasWidth) * 100}%`,
                            top: `${(item.y / canvasHeight) * 100}%`,
                            width: `${(w / canvasWidth) * 100}%`,
                            height: `${(h / canvasHeight) * 100}%`,
                            transform: `rotate(${rot}deg)`,
                            zIndex: idx + 1,
                          }}
                        >
                          <div className="w-full h-full rounded-sm overflow-hidden" style={item.flipX ? { transform: 'scaleX(-1)' } : undefined}>
                            <img src={item.image} alt="" draggable={false} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        <div className="px-5 pb-5 pt-3">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Create Collage
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BackgroundEraserModal
   ───────────────────────────────────────────────────────────────────────────── */
function BackgroundEraserModal({ image, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isErasing, setIsErasing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fetch(image)
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
          canvas.width  = Math.round(img.naturalWidth  * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
          setLoaded(true);
        };
        img.src = blobUrl;
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
          setLoaded(true);
        };
        img.src = image;
      });
  }, [image]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const pt = e.touches ? e.touches[0] : e;
    return { x: (pt.clientX - rect.left) * scaleX, y: (pt.clientY - rect.top) * scaleY };
  };

  const scaledRadius = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return brushSize * (canvas.width / rect.width);
  };

  const erasePoint = (ctx, x, y) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius(), 0, Math.PI * 2);
    ctx.fill();
  };

  const eraseLine = (ctx, x0, y0, x1, y1) => {
    const r = scaledRadius();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth  = r * 2;
    ctx.lineCap    = 'round';
    ctx.lineJoin   = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    erasePoint(canvasRef.current.getContext('2d'), pos.x, pos.y);
    lastPos.current = pos;
    setIsErasing(true);
  };

  const onPointerMove = (e) => {
    e.preventDefault();
    if (!isErasing) return;
    const pos = getPos(e);
    eraseLine(canvasRef.current.getContext('2d'), lastPos.current.x, lastPos.current.y, pos.x, pos.y);
    lastPos.current = pos;
  };

  const onPointerUp = () => {
    if (!isErasing) return;
    setIsErasing(false);
    const canvas = canvasRef.current;
    const snap = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    setHistory(h => [...h.slice(-19), snap]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newH = history.slice(0, -1);
    setHistory(newH);
    const canvas = canvasRef.current;
    canvas.getContext('2d').putImageData(newH[newH.length - 1], 0, 0);
  };

  const reset = () => {
    if (!history.length) return;
    const canvas = canvasRef.current;
    canvas.getContext('2d').putImageData(history[0], 0, 0);
    setHistory(h => [h[0]]);
  };

  const handleSave = () => {
    setSaving(true);
    canvasRef.current.toBlob(blob => onSave(blob), 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4 md:p-6">

      {/* Header row */}
      <div className="w-full max-w-lg flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Erase Background</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white disabled:opacity-25 transition-colors rounded-lg hover:bg-white/10"
          >
            <Undo2 size={13} /> Undo
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="ml-1 w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="w-full max-w-lg flex-1 flex items-center justify-center rounded-2xl overflow-hidden relative"
        style={{
          minHeight: 0,
          backgroundImage: 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%)',
          backgroundSize: '20px 20px',
        }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={24} className="text-white/50 animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none',
            opacity: loaded ? 1 : 0,
          }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg flex-shrink-0 mt-3 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <Brush size={13} className="text-white/40 flex-shrink-0" />
          <input
            type="range" min={4} max={60} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <div
            className="flex-shrink-0 rounded-full bg-white/80 transition-all"
            style={{ width: Math.max(8, Math.min(brushSize * 0.8, 40)), height: Math.max(8, Math.min(brushSize * 0.8, 40)) }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-white/70 border border-white/20 rounded-2xl hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !loaded}
            className="flex-1 py-3 text-sm font-medium bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function ItemModal({ item, liked, onToggleLike, onClose, onUpdate, onDelete, onAddToOutfit, onOpenCollage, savedOutfits, draftOutfits, boards, onToggleBoard, onUpdateImage }) {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollagePicker, setShowCollagePicker] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const boardMenuRef = useRef(null);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => {
      if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);
  const [draft, setDraft] = useState({
    name: item.name,
    brand: item.brand,
    price: item.price,
    category: item.category,
    size: item.size,
    material: item.material,
    notes: item.notes || '',
    attributes: item.attributes || { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: item.colorProfile || { primaryHex: '', colorFamily: '', undertone: 'Neutral', vibrancy: 'Muted' },
  });

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const setAttr = (key, val) => setDraft(d => ({ ...d, attributes: { ...d.attributes, [key]: val } }));
  const setColor = (key, val) => setDraft(d => ({ ...d, colorProfile: { ...d.colorProfile, [key]: val } }));

  const handleSave = () => {
    onUpdate(item.id, draft);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setDraft({
      name: item.name, brand: item.brand, price: item.price,
      category: item.category, size: item.size, material: item.material,
      notes: item.notes || '',
      attributes: item.attributes || { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
      colorProfile: item.colorProfile || { primaryHex: '', colorFamily: '', undertone: 'Neutral', vibrancy: 'Muted' },
    });
    setEditMode(false);
  };

  const editInput = "w-full bg-transparent border-b border-gray-200 focus:border-gray-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full md:w-[440px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden modal-animate max-h-[92vh] flex flex-col">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Top-right button cluster */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {editMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors bg-white rounded-full shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-md"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Pencil size={13} strokeWidth={2} className="text-gray-500" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <X size={14} strokeWidth={2.5} className="text-gray-500" />
          </button>
        </div>

        {/* Hero image */}
        <div className="relative flex-shrink-0 h-72 md:h-80 bg-gray-50 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain"
          />
          {editMode && (
            <button
              onClick={() => setShowEraser(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
            >
              <Eraser size={13} />
              Edit background
            </button>
          )}
        </div>

        {/* Brand + name + action buttons — kept outside scroll container so tooltip renders over image */}
        <div className="flex-shrink-0 px-6 pt-6 relative z-[1]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              {editMode ? (
                <div className="space-y-1.5">
                  <input
                    value={draft.brand}
                    onChange={e => set('brand', e.target.value)}
                    placeholder="Brand"
                    className={`${editInput} text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em] pb-0.5`}
                  />
                  <input
                    value={draft.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Item name"
                    className={`${editInput} text-xl font-semibold text-gray-900 pb-0.5`}
                  />
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
                    {item.brand}
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900 leading-snug">{item.name}</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save image to device */}
              <div className="relative group/download">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(item.image);
                      if (!res.ok) { window.open(item.image, '_blank'); return; }
                      const blob = await res.blob();
                      const extMap = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
                      const ext = extMap[blob.type] || 'jpg';
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${item.name || 'item'}.${ext}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      window.open(item.image, '_blank');
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-all"
                >
                  <Download size={15} className="text-gray-400" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/download:opacity-100 transition-opacity z-[20]">
                  Save image
                </div>
              </div>
              {/* Board membership toggle */}
              <div className="relative group/boards" ref={boardMenuRef}>
                <button
                  onClick={() => setBoardMenuOpen(o => !o)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                    boardMenuOpen ? 'bg-gray-900 border-gray-900' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Layers size={15} className={boardMenuOpen ? 'text-white' : 'text-gray-400'} />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/boards:opacity-100 transition-opacity z-[20]">
                  Move to board
                </div>
                {boardMenuOpen && (
                  <div className="absolute top-11 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[160px] z-10">
                    {boards.filter(b => b !== 'All').length === 0 ? (
                      <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                    ) : boards.filter(b => b !== 'All').map(board => {
                      const inBoard = item.boards.includes(board);
                      return (
                        <button
                          key={board}
                          onClick={() => onToggleBoard(item.id, board)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <span className="truncate">{board}</span>
                          {inBoard && <Check size={13} className="text-gray-900 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="relative group/like">
                <button
                  onClick={() => onToggleLike(item.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                    liked ? 'bg-rose-50 border-rose-200' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Heart size={15} className={liked ? 'text-rose-500 fill-rose-500' : 'text-gray-400'} />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/like:opacity-100 transition-opacity z-[20]">
                  Favorite item
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pb-6">

            {/* Price */}
            {editMode ? (
              <input
                value={draft.price}
                onChange={e => set('price', e.target.value)}
                placeholder="Price"
                className={`${editInput} text-3xl font-light tracking-tight text-gray-900 pb-0.5 mb-6 block`}
              />
            ) : (
              <p className="text-3xl font-light tracking-tight text-gray-900 mb-6">{item.price}</p>
            )}

            {/* Detail tiles */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {/* Category — dropdown in edit mode */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Category</p>
                {editMode ? (
                  <select
                    value={draft.category}
                    onChange={e => set('category', e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800 mt-0.5 cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-800">{item.category}</p>
                )}
              </div>

              {/* Size — free text */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Size</p>
                {editMode ? (
                  <input
                    value={draft.size}
                    onChange={e => set('size', e.target.value)}
                    className={`${editInput} text-sm font-medium text-gray-800 mt-0.5`}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{item.size}</p>
                )}
              </div>

              <div className="col-span-2 bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Material</p>
                {editMode ? (
                  <textarea
                    value={draft.material}
                    onChange={e => set('material', e.target.value)}
                    rows={2}
                    className={`${editInput} text-sm font-medium text-gray-800 mt-0.5 resize-none leading-relaxed w-full`}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 whitespace-pre-line">{item.material}</p>
                )}
              </div>

              {/* Notes */}
              <div className="col-span-2 bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Notes</p>
                {editMode ? (
                  <textarea
                    value={draft.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Add a note about this piece…"
                    rows={3}
                    className={`${editInput} text-sm text-gray-700 mt-0.5 resize-none leading-relaxed w-full`}
                  />
                ) : item.notes ? (
                  <p className="text-sm text-gray-600 leading-relaxed">{item.notes}</p>
                ) : (
                  <p className="text-sm text-gray-300 italic">No notes added</p>
                )}
              </div>

            </div>

            {/* Bottom actions — view mode only */}
            {!editMode && (
              <>
                <button
                  onClick={() => setShowCollagePicker(true)}
                  className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-semibold tracking-wide hover:bg-gray-700 active:scale-[0.98] transition-all mb-3"
                >
                  Add to Outfit
                </button>

                {showDeleteConfirm ? (
                  <div className="border border-red-100 bg-red-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Delete this item?</p>
                    <p className="text-xs text-gray-500 mb-3">This action can't be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 text-sm text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    Delete item
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {showCollagePicker && (
        <AddToCollageModal
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          onClose={() => setShowCollagePicker(false)}
          onCreateNew={() => { setShowCollagePicker(false); onAddToOutfit(item); }}
          onOpenCollage={(outfit, type) => { setShowCollagePicker(false); onOpenCollage(item, outfit, type); }}
        />
      )}

      {showEraser && (
        <BackgroundEraserModal
          image={item.image}
          onClose={() => setShowEraser(false)}
          onSave={blob => {
            setShowEraser(false);
            setEditMode(false);
            onUpdateImage?.(item.id, blob);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCard
   ───────────────────────────────────────────────────────────────────────────── */
function GridCard({ item, onClick }) {
  return (
    <div className="cursor-pointer group" onClick={() => onClick(item)}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <div className="w-full aspect-[3/4] p-3">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/6 transition-colors duration-300 pointer-events-none" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OrganizeCard
   ───────────────────────────────────────────────────────────────────────────── */
function OrganizeCard({ item, draggedId, selected, onSelect, onDragStart, onDragHover, onDragEnd }) {
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={e => {
        e.preventDefault();
        if (draggedId === item.id) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onDragHover(item.id, e.clientX, e.clientY, rect);
      }}
      onDrop={e => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={`relative rounded-2xl overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        draggedId === item.id ? 'opacity-40' : ''
      } ${selected ? 'ring-[3px] ring-gray-900' : ''}`}
    >
      <div className="w-full aspect-square">
        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover pointer-events-none" />
      </div>
      {selected && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WardrobeTab
   ───────────────────────────────────────────────────────────────────────────── */
function WardrobeTab({ items, boards, boardMeta, likedItems, onSelectItem, onDeleteBoard, onEditBoard, onDeleteItems, onCreateBoard, onToggleItemBoard, onAddItem }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState(null);
  const [editBoard, setEditBoard] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const addMenuRef = useRef(null);
  const boardMenuRef = useRef(null);

  const [organizeMode, setOrganizeMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [organizedItems, setOrganizedItems] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = e => {
      if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => {
      if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  useEffect(() => {
    setOrganizeMode(false);
    setSelectedItemIds(new Set());
    setOrganizedItems([]);
  }, [activeFilter, favoritesOnly]);

  const filtered = (() => {
    let list = activeFilter === 'All' ? items : items.filter(i => i.boards.includes(activeFilter));
    if (favoritesOnly) list = list.filter(i => likedItems.has(i.id));
    return list;
  })();

  const enterOrganize = () => {
    setOrganizedItems([...filtered]);
    setSelectedItemIds(new Set());
    setOrganizeMode(true);
  };

  const exitOrganize = () => {
    setOrganizeMode(false);
    setSelectedItemIds(new Set());
    setOrganizedItems([]);
    setDraggedId(null);
  };

  const toggleSelectItem = id => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDragHover = (targetId, clientX, clientY, rect) => {
    if (!draggedId || targetId === draggedId) return;
    setOrganizedItems(prev => {
      const from = prev.findIndex(i => i.id === draggedId);
      const to = prev.findIndex(i => i.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      // Only reorder once the cursor crosses the midpoint in the direction of travel
      const movingForward = from < to;
      const pastThreshold = movingForward
        ? (clientX > midX || clientY > midY)
        : (clientX < midX || clientY < midY);
      if (!pastThreshold) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab header ── */}
      <div className="px-5 md:px-7 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Wardrobe</h1>
            <div className="mt-4">
              <p className="text-3xl font-semibold text-gray-900 truncate">{activeFilter}</p>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
            <div className="min-h-[1.25rem] mt-0.5">
              {activeFilter !== 'All' && boardMeta[activeFilter]?.description && (
                <p className="text-sm text-gray-400 italic pl-3">{boardMeta[activeFilter].description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={organizeMode ? exitOrganize : enterOrganize}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors text-sm font-medium ${
                  organizeMode ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {organizeMode ? <X size={13} strokeWidth={2.5} /> : <Brush size={13} strokeWidth={2} />}
                {organizeMode ? 'Done' : 'Organize'}
              </button>
              {activeFilter !== 'All' && (
                <div className="relative" ref={boardMenuRef}>
                  <button
                    onClick={() => setBoardMenuOpen(o => o ? null : activeFilter)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xl leading-none"
                  >
                    ···
                  </button>
                  {boardMenuOpen && (
                    <div className="absolute left-0 top-11 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 z-20">
                      <button
                        onClick={() => {
                          setBoardMenuOpen(null);
                          setEditBoard(activeFilter);
                          setEditName(activeFilter);
                          setEditDesc(boardMeta[activeFilter]?.description ?? '');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit board
                      </button>
                      <button
                        onClick={() => { setBoardMenuOpen(null); setDeleteConfirmBoard(activeFilter); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                      >
                        Delete board
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Search size={16} strokeWidth={2} className="text-gray-600" />
            </button>
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setAddMenuOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Plus size={17} strokeWidth={2.5} className="text-white" />
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-36 z-20">
                  <button
                    onClick={() => { setAddMenuOpen(false); onAddItem(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Item
                  </button>
                  <button
                    onClick={() => { setAddMenuOpen(false); setNewBoardName(''); setNewBoardDesc(''); setNewBoardOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Board
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Board filter ── */}
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {boards.map(board => {
            const active = activeFilter === board;
            return (
              <button
                key={board}
                onClick={() => setActiveFilter(board)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-base font-medium transition-colors pb-0.5 ${
                  active
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                {board}
              </button>
            );
          })}
        </div>

        {/* ── Favorites toggle ── */}
        <div className="pb-3">
          <button
            onClick={() => setFavoritesOnly(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              favoritesOnly
                ? 'bg-rose-50 text-rose-500'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Heart size={13} className={favoritesOnly ? 'fill-rose-500' : ''} />
            Favorites
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Shirt size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-800">No items in this board</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(item => (
              <GridCard key={item.id} item={item} onClick={onSelectItem} />
            ))}
          </div>
        )}
      </div>

      {/* ── Organize mode full-screen overlay ── */}
      {organizeMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">

          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Organize Board</h2>
            <button
              onClick={exitOrganize}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {organizedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Shirt size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No items in this board</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {organizedItems.map(item => (
                  <OrganizeCard
                    key={item.id}
                    item={item}
                    draggedId={draggedId}
                    selected={selectedItemIds.has(item.id)}
                    onSelect={() => toggleSelectItem(item.id)}
                    onDragStart={() => setDraggedId(item.id)}
                    onDragHover={handleDragHover}
                    onDragEnd={() => setDraggedId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating trash bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {selectedItemIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{selectedItemIds.size} selected</span>
              )}
              <div className="relative group">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                  selectedItemIds.size > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Delete</span>
                </div>
                <button
                  disabled={selectedItemIds.size === 0}
                  onClick={() => setShowDeleteSelectedConfirm(true)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedItemIds.size > 0
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Delete selected confirmation */}
          {showDeleteSelectedConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setShowDeleteSelectedConfirm(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Delete {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {activeFilter === 'All'
                    ? `${selectedItemIds.size === 1 ? 'This item' : 'These items'} will be permanently removed from your wardrobe.`
                    : `${selectedItemIds.size === 1 ? 'This item' : 'These items'} will be removed from this board but stay in your wardrobe.`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const toDelete = new Set(selectedItemIds);
                      onDeleteItems(toDelete, activeFilter);
                      setOrganizedItems(prev => prev.filter(i => !toDelete.has(i.id)));
                      setSelectedItemIds(new Set());
                      setShowDeleteSelectedConfirm(false);
                    }}
                    className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteSelectedConfirm(false)}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Edit board popup ── */}
      {editBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setEditBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Board</h3>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span>
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                disabled={!editName.trim()}
                onClick={() => {
                  const trimmed = editName.trim();
                  onEditBoard(editBoard, trimmed, editDesc.trim());
                  if (activeFilter === editBoard) setActiveFilter(trimmed);
                  setEditBoard(null);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setEditBoard(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New board modal ── */}
      {newBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setNewBoardOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Board</h3>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span>
                </label>
                <textarea
                  value={newBoardDesc}
                  onChange={e => setNewBoardDesc(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                disabled={!newBoardName.trim() || boards.includes(newBoardName.trim())}
                onClick={() => {
                  const name = newBoardName.trim();
                  const desc = newBoardDesc.trim();
                  onCreateBoard(name, desc);
                  setActiveFilter(name);
                  setNewBoardOpen(false);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => setNewBoardOpen(false)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete board confirmation popup ── */}
      {deleteConfirmBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setDeleteConfirmBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete "{deleteConfirmBoard}"?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              This board will be permanently removed. Items inside won't be deleted.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onDeleteBoard(deleteConfirmBoard);
                  if (activeFilter === deleteConfirmBoard) setActiveFilter('All');
                  setDeleteConfirmBoard(null);
                }}
                className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
              >
                Delete Board
              </button>
              <button
                onClick={() => setDeleteConfirmBoard(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Weather helpers
   ───────────────────────────────────────────────────────────────────────────── */
const DEFAULT_CITY = 'New York';
const DEFAULT_LAT  = 40.7128;
const DEFAULT_LON  = -74.006;

function wmoCondition(code) {
  if (code <= 1)  return { label: 'Clear',         Icon: Sun,            bg: 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)' };
  if (code === 2) return { label: 'Partly Cloudy', Icon: CloudSun,       bg: 'linear-gradient(160deg,#1976D2,#546E7A)' };
  if (code === 3) return { label: 'Overcast',      Icon: Cloud,          bg: 'linear-gradient(160deg,#37474F,#546E7A)' };
  if (code <= 48) return { label: 'Foggy',         Icon: CloudFog,       bg: 'linear-gradient(160deg,#455A64,#78909C)' };
  if (code <= 57) return { label: 'Drizzle',       Icon: CloudDrizzle,   bg: 'linear-gradient(160deg,#1A237E,#1565C0)' };
  if (code <= 67) return { label: 'Rain',          Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 77) return { label: 'Snow',          Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  if (code <= 82) return { label: 'Showers',       Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 86) return { label: 'Snow Showers',  Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  return           { label: 'Thunderstorm',        Icon: CloudLightning, bg: 'linear-gradient(160deg,#1A1A2E,#0F3460)' };
}

function fmtHour(ms) {
  const h = new Date(ms).getHours();
  if (h === 0)  return '12am';
  if (h < 12)  return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   WeatherWidget
   ───────────────────────────────────────────────────────────────────────────── */
function WeatherWidget({ lat, lon, city, onCommit, onSelectLocation }) {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [isEditing,      setIsEditing]      = useState(false);
  const [inputValue,     setInputValue]     = useState('');
  const [suggestions,    setSuggestions]    = useState([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null) { setLoading(true); return; }
    setLoading(true);
    setData(null);
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=2`,
      { signal: ctrl.signal }
    )
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { if (e.name !== 'AbortError') setLoading(false); });
    return () => ctrl.abort();
  }, [lat, lon]);

  const startEditing = () => {
    setInputValue(city ?? '');
    setSuggestions([]);
    setHighlightedIdx(-1);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const clearSearch = () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setHighlightedIdx(-1);
  };

  const commit = () => {
    clearSearch();
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== city) onCommit(trimmed);
    setIsEditing(false);
  };

  const selectSuggestion = (result) => {
    clearSearch();
    const addr = result.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
    const region = addr.state_code || addr.state || '';
    const displayCity = region ? `${name}, ${region}` : name;
    onSelectLocation({ city: displayCity, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
    setIsEditing(false);
  };

  const onInputChange = (val) => {
    setInputValue(val);
    setHighlightedIdx(-1);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.trim())}&format=json&addressdetails=1&limit=5`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(await res.json());
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      }
    }, 320);
  };

  const onKeyDown = e => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Enter' && highlightedIdx >= 0) {
        selectSuggestion(suggestions[highlightedIdx]);
        return;
      }
    }
    if (e.key === 'Enter')  { commit(); return; }
    if (e.key === 'Escape') { clearSearch(); setIsEditing(false); }
  };

  const skeletonBg = 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)';

  if (loading || !data) {
    return (
      <div className="mb-6 rounded-3xl overflow-hidden" style={{ background: skeletonBg }}>
        <div className="px-6 pt-5 pb-4 animate-pulse">
          <div className="h-3 w-24 bg-white/20 rounded-full mb-4" />
          <div className="flex items-center justify-between">
            <div className="h-[72px] w-28 bg-white/20 rounded-2xl" />
            <div className="space-y-3 text-right">
              <div className="h-5 w-32 bg-white/20 rounded-full ml-auto" />
              <div className="h-4 w-24 bg-white/20 rounded-full ml-auto" />
            </div>
          </div>
        </div>
        <div className="mx-5 h-px bg-white/20" />
        <div className="flex px-4 py-3 gap-0.5 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 px-3 py-2 flex-shrink-0">
              <div className="h-3 w-7 bg-white/20 rounded-full" />
              <div className="h-[15px] w-[15px] bg-white/20 rounded-full" />
              <div className="h-3.5 w-7 bg-white/20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currTemp = Math.round(data.current.temperature_2m);
  const currCode = data.current.weather_code;
  const high     = Math.round(data.daily.temperature_2m_max[0]);
  const low      = Math.round(data.daily.temperature_2m_min[0]);
  const { label, Icon: CondIcon, bg } = wmoCondition(currCode);

  const nowMs = Date.now();
  const hours = [];
  for (let i = 0; i < data.hourly.time.length; i++) {
    const ms = new Date(data.hourly.time[i]).getTime();
    if (ms >= nowMs - 30 * 60 * 1000) {
      hours.push({
        key:  data.hourly.time[i],
        ms,
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weather_code[i],
      });
      if (hours.length >= 24) break;
    }
  }

  return (
    <div className="relative mb-6">
      <div className="rounded-3xl overflow-hidden shadow-md" style={{ background: bg }}>
        {/* Location row */}
        <div className="px-6 pt-5">
          <div className="relative flex items-center h-5">
            <div
              className="loc-pill absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 0 : 280, opacity: isEditing ? 0 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}
            >
              <button onClick={startEditing} className="flex items-center gap-1.5 whitespace-nowrap">
                <MapPin size={12} className="text-white/60 flex-shrink-0" />
                <span className="text-sm font-medium text-white/80 tracking-wide">{city ?? DEFAULT_CITY}</span>
              </button>
            </div>
            <div
              className="loc-input absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 280 : 0, opacity: isEditing ? 1 : 0, pointerEvents: isEditing ? 'auto' : 'none' }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <MapPin size={12} className="text-white/60 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={commit}
                  placeholder="Search city…"
                  className="bg-transparent text-sm font-medium text-white border-b border-white/40 focus:border-white/80 focus:outline-none w-48 placeholder:text-white/40 transition-colors"
                />
              </div>
            </div>
            <div className="invisible flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
              <MapPin size={12} className="mr-1" />{city ?? DEFAULT_CITY}
            </div>
          </div>
        </div>

        {/* Current conditions */}
        <div className="px-6 pt-3 pb-5 flex items-center justify-between">
          <div className="flex items-start">
            <span className="text-[68px] font-thin text-white leading-none tracking-tight">{currTemp}</span>
            <span className="text-xl font-light text-white/60 mt-3 ml-0.5">°F</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <CondIcon size={20} className="text-white/90" strokeWidth={1.8} />
              <span className="text-[17px] font-medium text-white">{label}</span>
            </div>
            <p className="text-sm text-white/60 font-medium tracking-wide">H: {high}°  ·  L: {low}°</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/20" />

        {/* Hourly scroll */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-0.5">
          {hours.map((h, idx) => {
            const { Icon: HIcon } = wmoCondition(h.code);
            return (
              <div key={h.key} className="flex flex-col items-center gap-1.5 px-3 py-2 flex-shrink-0">
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wide">
                  {idx === 0 ? 'Now' : fmtHour(h.ms)}
                </span>
                <HIcon size={15} className="text-white" strokeWidth={1.8} />
                <span className="text-sm font-medium text-white">{h.temp}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Autocomplete suggestions */}
      {isEditing && suggestions.length > 0 && (
        <div className="absolute top-[44px] left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          {suggestions.map((s, i) => {
            const addr = s.address || {};
            const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
            const region = addr.state_code || addr.state || '';
            const country = addr.country || '';
            const display = region ? `${name}, ${region}` : name;
            return (
              <button
                key={s.place_id ?? i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                  highlightedIdx === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{display}</p>
                  {country && <p className="text-xs text-gray-400 truncate">{country}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   Placeholder tabs (Today / Studio / AI Stylist)
   ───────────────────────────────────────────────────────────────────────────── */
function TodayTab() {
  const occasions = ['Morning Meeting', 'Lunch Catch-up', 'Evening Walk'];
  const [location, setLocation] = useState({ city: null, lat: null, lon: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const { address } = await res.json();
          const name = address.city || address.town || address.village || address.county || DEFAULT_CITY;
          const region = address.state_code || address.state || '';
          setLocation({ city: region ? `${name}, ${region}` : name, lat: latitude, lon: longitude });
        } catch {
          setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
        }
      },
      () => setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON }),
      { timeout: 8000 }
    );
  }, []);

  const handleSelectLocation = ({ city, lat, lon }) => {
    setLocation({ city, lat, lon });
  };

  const handleCitySearch = async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const [result] = await res.json();
      if (result) {
        const addr = result.address || {};
        const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
        const region = addr.state_code || addr.state || '';
        setLocation({
          city:   region ? `${name}, ${region}` : name,
          lat:    parseFloat(result.lat),
          lon:    parseFloat(result.lon),
        });
      } else {
        setLocation(l => ({ ...l, city: query }));
      }
    } catch {
      setLocation(l => ({ ...l, city: query }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-6 md:px-10 pb-28 md:pb-8">
      {/* Header */}
      <div className="pt-8 mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Today's Looks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Curated from your wardrobe</p>
      </div>

      {/* Weather module */}
      <WeatherWidget lat={location.lat} lon={location.lon} city={location.city} onCommit={handleCitySearch} onSelectLocation={handleSelectLocation} />

      {/* Skeleton cards */}
      <div className="space-y-3">
        {occasions.map((label, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded-full w-3/4 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              <div className="h-2.5 bg-gray-100 rounded-full w-1/2 animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.05}s` }} />
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 animate-pulse" />
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.18em]">
        Coming Soon
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CreateOutfitModal
   ───────────────────────────────────────────────────────────────────────────── */
function CreateOutfitModal({ initialItem, initialCanvasItems, initialBgColor, onClose, onPublish, onAutoSave, onDetachCollage, items = [], boards = ['All'] }) {
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingCid, setDraggingCid] = useState(null);
  const [selectedCid, setSelectedCid] = useState(null);
  const [bgColor, setBgColor] = useState(initialBgColor ?? '#FFFFFF');
  const [bgLayerSelected, setBgLayerSelected] = useState(false);
  const [hexInput, setHexInput] = useState((initialBgColor ?? '#FFFFFF').replace('#', ''));
  const [layerDragging, setLayerDragging] = useState(null);
  const [layerMenuState, setLayerMenuState] = useState(null); // { cid, rect }
  const canvasRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bgRowRef = useRef(null);
  const layerMenuRef = useRef(null);
  const collageMenuRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [collageMenuOpen, setCollageMenuOpen] = useState(false);

  const ITEM_SIZE = 128;
  const DOT_GRID_STYLE = {
    backgroundColor: '#F3F5F4',
    backgroundImage: 'radial-gradient(circle, #C6C9CC 1.5px, transparent 1.5px)',
    backgroundSize: '28px 28px',
    backgroundPosition: 'center',
  };
  const bgStyle = bgColor === '#FFFFFF' ? DOT_GRID_STYLE : { backgroundColor: bgColor };
  const swatchStyle = bgColor === '#FFFFFF'
    ? { ...DOT_GRID_STYLE, backgroundSize: '7px 7px', backgroundImage: 'radial-gradient(circle, #C6C9CC 1px, transparent 1px)' }
    : { backgroundColor: bgColor };
  const BG_COLORS = [
    //           red        orange     yellow     green      blue       purple     pink
    /* light  */ '#FFFFFF','#FFF3E0','#FFFDE7','#F1F8E9','#E3F2FD','#F3E5F5','#FCE4EC',
    /* mid    */ '#F44336','#FF9800','#FFEB3B','#4CAF50','#2196F3','#9C27B0','#E91E63',
    /* dark   */ '#B71C1C','#E65100','#F57F17','#1B5E20','#0D47A1','#4A148C','#880E4F',
    /* darker */ '#7B0000','#7C2900','#5D3A00','#0A3D0C','#0A1F5C','#1A0033','#000000',
  ];

  const pushHistory = snapshot => {
    historyRef.current = [...historyRef.current, snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const undo = () => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [canvasItems, ...futureRef.current];
    setCanvasItems(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, canvasItems];
    setCanvasItems(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const base = initialCanvasItems || [];
    if (!initialItem) {
      if (base.length > 0) setCanvasItems(base);
      return;
    }
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, (width  - ITEM_SIZE) / 2);
    const y = Math.max(0, (height - ITEM_SIZE) / 2);
    setCanvasItems([...base, { ...initialItem, _cid: `${initialItem.id}-${Date.now()}`, x, y, w: ITEM_SIZE, h: ITEM_SIZE, rotation: 0 }]);
  }, []);

  const buildSnapshot = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return {
      items: canvasItems,
      bgColor,
      canvasWidth: rect?.width ?? 480,
      canvasHeight: rect?.height ?? 679,
    };
  };

  const handleClose = () => {
    onAutoSave(buildSnapshot());
    onClose();
  };

  const filtered =
    activeFilter === 'All'
      ? items
      : items.filter(i => i.boards.includes(activeFilter));

  // Click-to-add: cascade items from center so they don't stack
  const addToCanvas = item => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 480;
    const ch = rect?.height ?? 679;
    const offset = (canvasItems.length % 7) * 20;
    const x = Math.max(0, Math.min((cw - ITEM_SIZE) / 2 - 60 + offset, cw - ITEM_SIZE));
    const y = Math.max(0, Math.min((ch - ITEM_SIZE) / 2 - 60 + offset, ch - ITEM_SIZE));
    pushHistory(canvasItems);
    setCanvasItems(prev => [
      ...prev,
      { ...item, _cid: `${item.id}-${Date.now()}`, x, y, w: ITEM_SIZE, h: ITEM_SIZE, rotation: 0 },
    ]);
  };

  const duplicateItem = cid => {
    const item = canvasItems.find(i => i._cid === cid);
    if (!item) return;
    const newCid = `${item.id}-${Date.now()}`;
    const newItem = { ...item, _cid: newCid, x: item.x + 20, y: item.y + 20 };
    pushHistory(canvasItems);
    setCanvasItems(prev => [...prev, newItem]);
    setSelectedCid(newCid);
  };

  const removeFromCanvas = cid => {
    pushHistory(canvasItems);
    setCanvasItems(prev => prev.filter(i => i._cid !== cid));
  };

  // ── HTML5 drag-and-drop: wardrobe → canvas ──
  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('itemId', String(item.id));
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = e => {
    // only clear if leaving the canvas itself, not a child
    if (!canvasRef.current?.contains(e.relatedTarget)) setIsDragOver(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    const item = items.find(i => i.id === Number(e.dataTransfer.getData('itemId')));
    if (!item) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - ITEM_SIZE / 2, rect.width  - ITEM_SIZE));
    const y = Math.max(0, Math.min(e.clientY - rect.top  - ITEM_SIZE / 2, rect.height - ITEM_SIZE));
    pushHistory(canvasItems);
    setCanvasItems(prev => [...prev, { ...item, _cid: `${item.id}-${Date.now()}`, x, y, w: ITEM_SIZE, h: ITEM_SIZE, rotation: 0 }]);
  };

  // ── Mouse drag: reposition items already on canvas ──
  const startItemDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCid(cid);
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const itemW = item.w ?? ITEM_SIZE;
    const itemH = item.h ?? ITEM_SIZE;
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    setDraggingCid(cid);

    const onMove = e => {
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      setCanvasItems(prev => prev.map(i => i._cid === cid ? { ...i, x, y } : i));
    };
    const onUp = () => {
      setDraggingCid(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Resize: drag a corner handle to change w/h ──
  const startResizeDrag = (e, cid, corner) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const startX = e.clientX;
    const startW = item.w ?? ITEM_SIZE;
    const startH = item.h ?? ITEM_SIZE;
    const ratio = startW / startH;
    const startItemX = item.x;
    const startItemY = item.y;

    const onMove = e => {
      const dx = e.clientX - startX;
      setCanvasItems(prev => prev.map(i => {
        if (i._cid !== cid) return i;
        let x = startItemX, y = startItemY, w, h, flipX;
        if (corner === 'se') {
          const rawW = startW + dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX - w : startItemX;
        }
        if (corner === 'sw') {
          const rawW = startW - dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX + startW : startItemX + startW - w;
        }
        if (corner === 'ne') {
          const rawW = startW + dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX - w : startItemX;
          y = startItemY + startH - h;
        }
        if (corner === 'nw') {
          const rawW = startW - dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX + startW : startItemX + startW - w;
          y = startItemY + startH - h;
        }
        return { ...i, x, y, w, h, flipX };
      }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Rotate: drag the top handle to spin the item ──
  const startRotateDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const w = item.w ?? ITEM_SIZE;
    const h = item.h ?? ITEM_SIZE;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + item.x + w / 2;
    const centerY = rect.top  + item.y + h / 2;

    const onMove = e => {
      const raw = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
      const nearest90 = Math.round(raw / 90) * 90;
      const angle = Math.abs(raw - nearest90) < 8 ? nearest90 : raw;
      setCanvasItems(prev => prev.map(i => i._cid === cid ? { ...i, rotation: angle } : i));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Layer reorder drag ──
  const startLayerDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    setLayerDragging(cid);
    const onMove = e => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest('[data-layer-cid]');
      const hoverCid = row?.dataset?.layerCid;
      if (hoverCid && hoverCid !== cid) {
        setCanvasItems(prev => {
          const arr = [...prev];
          const from = arr.findIndex(i => i._cid === cid);
          const to   = arr.findIndex(i => i._cid === hoverCid);
          if (from === -1 || to === -1) return prev;
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return arr;
        });
      }
    };
    const onUp = () => {
      setLayerDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const moveLayerTo = (cid, dir) => {
    pushHistory(canvasItems);
    setCanvasItems(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(i => i._cid === cid);
      if (idx === -1) return prev;
      const [item] = arr.splice(idx, 1);
      if (dir === 'top')         arr.push(item);
      else if (dir === 'bottom') arr.unshift(item);
      else if (dir === 'up')     arr.splice(Math.min(idx + 1, arr.length), 0, item);
      else if (dir === 'down')   arr.splice(Math.max(idx - 1, 0), 0, item);
      return arr;
    });
    setLayerMenuState(null);
  };

  useEffect(() => {
    if (!layerMenuState) return;
    const handler = e => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target)) {
        setLayerMenuState(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [layerMenuState]);

  useEffect(() => {
    if (!collageMenuOpen) return;
    const handler = e => {
      if (collageMenuRef.current && !collageMenuRef.current.contains(e.target)) {
        setCollageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [collageMenuOpen]);

  const startNewCollage = () => {
    setCanvasItems([]);
    setSelectedCid(null);
    setBgLayerSelected(false);
    setBgColor('#FFFFFF');
    setHexInput('FFFFFF');

    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setCollageMenuOpen(false);
    onDetachCollage?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="relative z-[1100] flex items-center px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X size={20} className="text-gray-600" />
        </button>
        {/* Centered undo / redo / menu */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Undo2 size={22} className="text-gray-600" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Redo2 size={22} className="text-gray-600" />
          </button>
          {/* Collage options menu */}
          <div className="relative" ref={collageMenuRef}>
            <button
              onClick={() => setCollageMenuOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={22} className="text-gray-600" />
            </button>
            {collageMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-[1200]">
                <button
                  onClick={startNewCollage}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Start new collage
                </button>
                <button
                  onClick={() => { setCollageMenuOpen(false); onClose(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Delete collage
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { onPublish(buildSnapshot()); onClose(); }}
            disabled={canvasItems.length === 0}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Body — layers left, canvas center, wardrobe panel right */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">

        {/* ── Layers panel ── */}
        <div className="hidden md:flex flex-col w-72 flex-shrink-0 border-r border-gray-100 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Layers</p>
            <p className="text-xs text-gray-400 mt-1 leading-snug">Tap or drag to add an item to the canvas</p>
          </div>

          {/* All layers in one scrollable list — items first, background last */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
            {[...canvasItems].reverse().map(item => (
              <div
                key={item._cid}
                data-layer-cid={item._cid}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer ${selectedCid === item._cid ? 'bg-blue-50' : ''} ${layerDragging === item._cid ? 'opacity-40' : ''}`}
                onClick={() => { setSelectedCid(item._cid); setBgLayerSelected(false); }}
              >
                <div
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
                  onMouseDown={e => startLayerDrag(e, item._cid)}
                  onClick={e => e.stopPropagation()}
                >
                  <GripVertical size={16} />
                </div>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-cover" style={item.flipX ? { transform: 'scaleX(-1)' } : undefined} />
                </div>
                <span className="text-sm text-gray-700 truncate leading-tight flex-1">{item.name}</span>
                <button
                  className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setLayerMenuState(prev => prev?.cid === item._cid ? null : { cid: item._cid, rect });
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}

            {/* Background layer — always at bottom of list */}
            <div
              ref={bgRowRef}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer ${bgLayerSelected ? 'bg-blue-50' : ''}`}
              onClick={() => { setBgLayerSelected(s => !s); setSelectedCid(null); }}
            >
              <Lock size={14} className="flex-shrink-0 text-gray-400" />
              <div className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0" style={swatchStyle} />
              <span className="text-sm text-gray-700 flex-1">Background</span>
            </div>
          </div>
        </div>

        {/* Color picker popup — fixed position aligned to background layer row */}
        {bgLayerSelected && bgRowRef.current && (() => {
          const r = bgRowRef.current.getBoundingClientRect();
          return (
            <div className="hidden md:block fixed z-[60]" style={{ top: r.top, left: r.right + 8 }}>
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-64">
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {BG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setBgColor(color); setHexInput(color.replace('#', '')); }}
                      className="aspect-square rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: color, borderColor: bgColor === color ? '#60a5fa' : '#e5e7eb' }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-mono">#</span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                      setHexInput(val);
                      if (val.length === 6) setBgColor('#' + val);
                    }}
                    maxLength={6}
                    placeholder="FFFFFF"
                    className="flex-1 min-w-0 text-[11px] font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Item action toolbar — fixed so it's never clipped by canvas overflow */}
        {selectedCid && canvasRef.current && (() => {
          const item = canvasItems.find(i => i._cid === selectedCid);
          if (!item) return null;
          const cr = canvasRef.current.getBoundingClientRect();
          const w = item.w ?? ITEM_SIZE;
          const h = item.h ?? ITEM_SIZE;
          const toolbarW = 104;
          const toolbarH = 52;
          const pad = 8;
          // horizontal: center on item, clamped inside canvas
          const rawX = cr.left + item.x + w / 2;
          const clampedX = Math.max(cr.left + toolbarW / 2 + pad, Math.min(rawX, cr.right - toolbarW / 2 - pad));
          // vertical: below item if it fits, otherwise above
          const rawBelow = cr.top + item.y + h + 12;
          const rawAbove = cr.top + item.y - toolbarH - 12;
          const fitsBelow = rawBelow + toolbarH <= cr.bottom - pad;
          const top = fitsBelow ? rawBelow : Math.max(cr.top + pad, rawAbove);
          return (
            <div
              className="fixed z-[1100] flex gap-1 bg-gray-900 rounded-full shadow-lg px-2 py-2"
              style={{ top, left: clampedX, transform: 'translateX(-50%)' }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div className="relative group/dup">
                <button
                  onClick={e => { e.stopPropagation(); duplicateItem(selectedCid); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Plus size={17} className="text-white" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/dup:opacity-100 transition-opacity z-20">
                  Duplicate
                </div>
              </div>
              <div className="relative group/del">
                <button
                  onClick={e => { e.stopPropagation(); removeFromCanvas(selectedCid); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/del:opacity-100 transition-opacity z-20">
                  Delete
                </div>
              </div>
            </div>
          );
        })()}

        {/* Layer reorder menu popup */}
        {layerMenuState && (
          <div
            ref={layerMenuRef}
            className="fixed z-[60]"
            style={{ top: layerMenuState.rect.top, left: layerMenuState.rect.right + 8 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-44">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-2">Reorder menu</p>
              {[
                { label: 'Move to top',    dir: 'top'    },
                { label: 'Move up',        dir: 'up'     },
                { label: 'Move down',      dir: 'down'   },
                { label: 'Move to bottom', dir: 'bottom' },
              ].map(({ label, dir }) => (
                <button
                  key={dir}
                  onClick={() => moveLayerTo(layerMenuState.cid, dir)}
                  className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Canvas viewport (neutral surround) ── */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden bg-white p-8"
          onClick={() => { setSelectedCid(null); setBgLayerSelected(false); }}
        >
          {/* ── A4 paper canvas ── */}
          <div
            ref={canvasRef}
            className={`relative overflow-hidden rounded-2xl transition-[filter] duration-150 ${isDragOver ? 'brightness-95' : ''}`}
            style={{
              aspectRatio: '210 / 297',
              height: '100%',
              maxWidth: '100%',
              ...bgStyle,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

          {/* Drop target indicator */}
          {isDragOver && (
            <div className="absolute inset-3 border-2 border-dashed border-gray-400 rounded-2xl pointer-events-none flex items-center justify-center">
              <p className="text-sm font-medium text-gray-400 select-none">Drop to place</p>
            </div>
          )}

          {/* Canvas items — absolutely positioned, draggable to reposition */}
          {canvasItems.map((item, idx) => {
            const w = item.w ?? ITEM_SIZE;
            const h = item.h ?? ITEM_SIZE;
            const rot = item.rotation ?? 0;
            const isSelected = selectedCid === item._cid;
            return (
              <div
                key={item._cid}
                style={{
                  left: item.x,
                  top: item.y,
                  width: w,
                  height: h,
                  transform: `rotate(${rot}deg)`,
                  zIndex: draggingCid === item._cid ? 1000 : isSelected ? 500 : idx + 1,
                }}
                className="absolute group select-none cursor-grab active:cursor-grabbing"
                onMouseDown={e => startItemDrag(e, item._cid)}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className={`w-full h-full ${isSelected ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
                  style={item.flipX ? { transform: 'scaleX(-1)' } : undefined}
                >
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                </div>
                {/* Selection handles */}
                {isSelected && (
                  <>
                    {/* Rotate handle */}
                    <div
                      style={{ top: -28, left: '50%', transform: 'translateX(-50%)' }}
                      className="absolute w-5 h-5 bg-white border-2 border-blue-400 rounded-full cursor-crosshair shadow z-10"
                      onMouseDown={e => { e.stopPropagation(); startRotateDrag(e, item._cid); }}
                    />
                    {/* Corner resize handles */}
                    <div style={{ top: -4, left: -4 }}    className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-nw-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'nw'); }} />
                    <div style={{ top: -4, right: -4 }}   className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-ne-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'ne'); }} />
                    <div style={{ bottom: -4, left: -4 }}  className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-sw-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'sw'); }} />
                    <div style={{ bottom: -4, right: -4 }} className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-se-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'se'); }} />
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* ── Mini wardrobe panel ── */}
        <div className="w-full flex flex-col flex-shrink-0 h-56 md:h-auto md:w-[480px] bg-white border-l border-gray-100">

          {/* Board filter — collapsible */}
          <div className="flex-shrink-0 border-b border-gray-100">
            <button
              onClick={() => setBoardsOpen(o => !o)}
              className="flex items-center justify-between w-full px-4 py-3 text-left"
            >
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Board</p>
                <p className="text-sm font-medium text-gray-800">{activeFilter}</p>
              </div>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${boardsOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {boardsOpen && (
              <div className="border-t border-gray-100 py-1">
                {boards.map(board => {
                  const active = activeFilter === board;
                  return (
                    <button
                      key={board}
                      onClick={() => setActiveFilter(board)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {board}
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  onClick={() => addToCanvas(item)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#f0f0f0] bg-[repeating-conic-gradient(#e0e0e0_0%_25%,#f0f0f0_0%_50%)] [background-size:12px_12px] hover:opacity-75 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
                >
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OutfitCard
   ───────────────────────────────────────────────────────────────────────────── */
async function saveCollageAsPng(outfit) {
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679, name } = outfit;
  const SCALE = 2;
  const W = canvasWidth * SCALE;
  const H = canvasHeight * SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  if (bgColor !== '#FFFFFF') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  const bitmaps = await Promise.all(
    items.map(async item => {
      try {
        const res = await fetch(item.image);
        if (!res.ok) return null;
        return createImageBitmap(await res.blob());
      } catch { return null; }
    })
  );

  items.forEach((item, idx) => {
    const bitmap = bitmaps[idx];
    if (!bitmap) return;
    const x   = (item.x   ?? 0)   * SCALE;
    const y   = (item.y   ?? 0)   * SCALE;
    const w   = (item.w   ?? 128) * SCALE;
    const h   = (item.h   ?? 128) * SCALE;
    const rot = (item.rotation ?? 0) * Math.PI / 180;
    const imgAspect = bitmap.width / bitmap.height;
    const boxAspect = w / h;
    let drawW, drawH, offX = 0, offY = 0;
    if (imgAspect > boxAspect) {
      drawW = w; drawH = w / imgAspect; offY = (h - drawH) / 2;
    } else {
      drawH = h; drawW = h * imgAspect; offX = (w - drawW) / 2;
    }
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    if (item.flipX) ctx.scale(-1, 1);
    ctx.drawImage(bitmap, -w / 2 + offX, -h / 2 + offY, drawW, drawH);
    ctx.restore();
    bitmap.close();
  });

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'outfit'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function OutfitCard({ outfit, onDelete, onEdit, isDraft }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dotsRef = useRef(null);
  const dropdownRef = useRef(null);
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (!dotsRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className="group relative cursor-pointer"
      style={{ aspectRatio: '210 / 297' }}
    >
      {/* Background + items (clipped to rounded rect) */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={bgStyle}
      >
        {items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <Wand2 size={20} className="text-gray-300" />
          </div>
        ) : items.map((item, idx) => {
          const w = item.w ?? 128;
          const h = item.h ?? 128;
          const rot = item.rotation ?? 0;
          return (
            <div
              key={item._cid ?? idx}
              style={{
                position: 'absolute',
                left: `${(item.x / canvasWidth) * 100}%`,
                top: `${(item.y / canvasHeight) * 100}%`,
                width: `${(w / canvasWidth) * 100}%`,
                height: `${(h / canvasHeight) * 100}%`,
                transform: item.flipX ? `rotate(${rot}deg) scaleX(-1)` : `rotate(${rot}deg)`,
                zIndex: idx + 1,
              }}
            >
              <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
            </div>
          );
        })}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none z-10" />
      </div>

      {/* Action buttons — outside overflow-hidden so menu can escape card bounds */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
        <button
          onClick={e => { e.stopPropagation(); onEdit?.(); }}
          className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
        >
          <Pencil size={13} className="text-gray-700" />
        </button>
        <div ref={dotsRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Dropdown — child of outer card so top-full aligns to card's bottom edge */}
      {menuOpen && (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1 w-40 z-20 overflow-hidden">
          <button
            onClick={async e => {
              e.stopPropagation();
              setMenuOpen(false);
              setSaving(true);
              try { await saveCollageAsPng(outfit); } finally { setSaving(false); }
            }}
            disabled={saving}
            className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save to device'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete?.(); }}
            className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function StudioTab({ savedOutfits, draftOutfits, onSaveOutfit, onSaveDraftOutfit, onUpdateSavedOutfit, onUpdateDraftOutfit, onRemoveDraftOutfit, onRemoveSavedOutfit, pendingOutfitItem, pendingTargetCollage, onClearPendingOutfit, items, boards }) {
  const [showCreate, setShowCreate]         = useState(false);
  const [createSeed, setCreateSeed]         = useState(null);
  const [initialCanvasItems, setInitialCanvasItems] = useState(null);
  const [initialBgColor, setInitialBgColor] = useState(null);
  const [editingCollage, setEditingCollage] = useState(null);
  const [view, setView]                     = useState('saved');

  useEffect(() => {
    if (!pendingOutfitItem) return;
    setCreateSeed(pendingOutfitItem);
    if (pendingTargetCollage) {
      const list = pendingTargetCollage.type === 'saved' ? savedOutfits : draftOutfits;
      const outfit = list.find(o => o.id === pendingTargetCollage.id);
      setInitialCanvasItems(outfit?.items || []);
      setInitialBgColor(outfit?.bgColor ?? null);
      setEditingCollage(pendingTargetCollage);
    } else {
      setInitialCanvasItems(null);
      setInitialBgColor(null);
      setEditingCollage(null);
    }
    setShowCreate(true);
    onClearPendingOutfit();
  }, [pendingOutfitItem]);

  const list = view === 'saved' ? savedOutfits : draftOutfits;

  const openCollageForEditing = (outfit, type) => {
    setCreateSeed(null);
    setInitialCanvasItems(outfit.items || []);
    setInitialBgColor(outfit.bgColor ?? null);
    setEditingCollage({ id: outfit.id, type });
    setShowCreate(true);
  };

  const emptyLabel = view === 'saved'
    ? { title: 'No published outfits', sub: 'Tap + and publish to save your look' }
    : { title: 'No drafts', sub: 'Start a collage and it will autosave as a draft' };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Style Studio</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Plus size={17} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {/* Published / Drafts toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit gap-1">
            {[
              { key: 'saved',  label: 'Published',  count: savedOutfits.length  },
              { key: 'drafts', label: 'Drafts', count: draftOutfits.length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[11px] tabular-nums ${view === key ? 'text-gray-400' : 'text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-10 pb-28 md:pb-8">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Wand2 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-800">{emptyLabel.title}</p>
              <p className="text-sm text-gray-400 mt-1">{emptyLabel.sub}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {list.map(outfit => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  isDraft={view === 'drafts'}
                  onEdit={() => openCollageForEditing(outfit, view === 'drafts' ? 'drafts' : 'saved')}
                  onDelete={() => {
                    if (view === 'drafts') onRemoveDraftOutfit(outfit.id);
                    else onRemoveSavedOutfit?.(outfit.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateOutfitModal
          initialItem={createSeed}
          initialCanvasItems={initialCanvasItems}
          initialBgColor={initialBgColor}
          onClose={() => { setShowCreate(false); setCreateSeed(null); setInitialCanvasItems(null); setInitialBgColor(null); setEditingCollage(null); }}
          onPublish={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
            } else {
              if (editingCollage?.type === 'drafts') onRemoveDraftOutfit(editingCollage.id);
              onSaveOutfit(collage);
            }
            setView('saved');
          }}
          onAutoSave={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
              setView('saved');
            } else if (editingCollage?.type === 'drafts') {
              onUpdateDraftOutfit(editingCollage.id, collage);
              setView('drafts');
            } else if (collage.items.length > 0) {
              onSaveDraftOutfit(collage);
              setView('drafts');
            }
          }}
          onDetachCollage={() => setEditingCollage(null)}
          items={items}
          boards={boards}
        />
      )}
    </>
  );
}

function StylistTab() {
  const prompts = [
    'What should I wear to a rooftop dinner?',
    'Build a capsule wardrobe from my basics',
    "What's trending for autumn?",
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Stylist</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your personal style advisor</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-10">
        {/* AI greeting bubble */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={14} className="text-emerald-500" />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-sm text-gray-700 leading-relaxed">
              Hi! I've reviewed your wardrobe. Ask me anything about your style.
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="ml-11 space-y-2 mb-6">
          {prompts.map((p, i) => (
            <button
              key={i}
              className="block text-left w-full px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="px-6 md:px-10 pb-28 md:pb-8 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles size={12} className="text-emerald-500" />
          </div>
          <p className="text-sm text-gray-400 flex-1 text-left">Ask your stylist anything…</p>
          <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronRight size={13} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.18em]">
          Coming Soon
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AddItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function convertToPng(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function enrichItem({ imageUrl, imageFile, name, brand, category, material, color }) {
  const body = imageFile
    ? { imageBase64: await fileToBase64(imageFile), mediaType: imageFile.type, name, brand, category, material, color }
    : { imageUrl, name, brand, category, material, color };
  const res = await fetch('/api/enrich-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Enrichment failed');
  return res.json();
}

function AddMethodModal({ onClose, onImageSelected }) {
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const resultBlob = await new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('./bgRemovalWorker.js', import.meta.url),
          { type: 'module' },
        );
        worker.onmessage = ({ data }) => {
          worker.terminate();
          if (data.ok) resolve(new Blob([data.buffer], { type: 'image/png' }));
          else reject(new Error(data.message));
        };
        worker.onerror = (err) => { worker.terminate(); reject(err); };
        worker.postMessage({ buffer, name: file.name, type: file.type }, [buffer]);
      });
      const processedFile = new File([resultBlob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
      onImageSelected(processedFile);
    } catch (err) {
      console.error('Background removal failed, converting to PNG:', err);
      const converted = await convertToPng(file);
      onImageSelected(converted);
    }
  };

  if (processing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" />
        <div className="relative bg-white rounded-3xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 size={26} className="text-gray-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">Removing background</p>
            <p className="text-xs text-gray-400 mt-0.5">This may take a moment…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[360px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl modal-animate">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={14} strokeWidth={2.5} className="text-gray-500" />
        </button>

        <div className="px-6 pt-6 pb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add item</p>
        </div>

        <div className="px-3 pb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Add from photo gallery</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="mx-4 border-t border-gray-100" />

          <div className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl opacity-40 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Take a photo</span>
            <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdd, initialImage }) {
  const [imageFile, setImageFile] = useState(initialImage ?? null);
  const [previewUrl, setPreviewUrl] = useState(() => initialImage ? URL.createObjectURL(initialImage) : null);
  const [showEraser, setShowEraser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', price: '', size: '', material: '', color: '',
    category: CATEGORIES[0], notes: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const editInput = "w-full bg-transparent border-b border-gray-200 focus:border-gray-500 focus:outline-none transition-colors text-sm font-medium text-gray-800 pb-0.5";

  const handleEraserSave = (blob) => {
    const newFile = new File([blob], 'edited.png', { type: 'image/png' });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setShowEraser(false);
  };

  const handleAdd = () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    onAdd(form, imageFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[440px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden modal-animate max-h-[92vh] flex flex-col">

        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          <button
            onClick={handleAdd}
            disabled={saving || !form.name.trim()}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md flex items-center gap-1.5"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            Add
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <X size={14} strokeWidth={2.5} className="text-gray-500" />
          </button>
        </div>

        {/* Hero image */}
        {previewUrl && (
          <div
            className="relative flex-shrink-0 h-64 overflow-hidden"
            style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%)', backgroundSize: '20px 20px' }}
          >
            <img src={previewUrl} alt="" className="w-full h-full object-contain" />
            <button
              onClick={() => setShowEraser(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
            >
              <Eraser size={13} />
              Edit background
            </button>
          </div>
        )}

        {showEraser && (
          <BackgroundEraserModal
            image={previewUrl}
            onClose={() => setShowEraser(false)}
            onSave={handleEraserSave}
          />
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pt-6 pb-6 space-y-5">
            <div className="space-y-3">
              <input
                autoFocus
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Item name *"
                className={`${editInput} text-lg`}
              />
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Brand"
                className={editInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800 cursor-pointer border-b border-gray-200 pb-0.5"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Size</p>
                <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. S" className={editInput} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. $120" className={editInput} />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Material</p>
              <input value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. 100% Silk" className={editInput} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DB ↔ App shape converters
   ───────────────────────────────────────────────────────────────────────────── */
function dbItemToApp(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    size: row.size,
    material: row.material,
    color: row.color,
    category: row.category,
    notes: row.notes,
    image: row.image_url,
    boards: row.board_names || [],
    liked: row.liked,
    ratio: 'portrait',
    attributes: row.attributes || { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: row.color_profile || { primaryHex: '', colorFamily: '', undertone: 'Neutral', vibrancy: 'Muted' },
  };
}

function dbOutfitToApp(row) {
  const ci = row.canvas_items;
  const isLegacyArray = Array.isArray(ci);
  return {
    id: row.id,
    name: row.name,
    thumbnail: row.thumbnail,
    items:       isLegacyArray ? ci          : (ci?.items       ?? []),
    bgColor:     isLegacyArray ? '#FFFFFF'   : (ci?.bgColor     ?? '#FFFFFF'),
    canvasWidth:  isLegacyArray ? 480        : (ci?.canvasWidth  ?? 480),
    canvasHeight: isLegacyArray ? 679        : (ci?.canvasHeight ?? 679),
  };
}

function collageToDbPayload(collage) {
  return {
    items:       collage.items       ?? [],
    bgColor:     collage.bgColor     ?? '#FFFFFF',
    canvasWidth:  collage.canvasWidth  ?? 480,
    canvasHeight: collage.canvasHeight ?? 679,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   AuthScreen
   ───────────────────────────────────────────────────────────────────────────── */
function AuthScreen() {
  const [mode, setMode]       = useState('signin');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            name: name.trim(),
            bio: '',
            top_size: '',
            bottom_size: '',
            shoe_size: '',
            styles: [],
          });
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">est. 2024</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          <p className="text-sm text-gray-400 mt-1">Your digital wardrobe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Sign Up' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProfileTab
   ───────────────────────────────────────────────────────────────────────────── */
const STYLE_TAGS = ['Minimalist', 'Classic', 'Casual', 'Streetwear', 'Formal', 'Bohemian', 'Athletic', 'Romantic'];
const TOP_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['24', '25', '26', '27', '28', '29', '30', '32', 'XS', 'S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '11', '12'];

function ProfileTab({ items, boards, savedOutfits, profile, onUpdateProfile, onSignOut }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(profile);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile]);

  const stats = [
    { label: 'Items',   value: items.length },
    { label: 'Boards',  value: boards.filter(b => b !== 'All').length },
    { label: 'Outfits', value: savedOutfits.length },
  ];

  const toggleStyle = tag => {
    setDraft(d => ({
      ...d,
      styles: d.styles.includes(tag) ? d.styles.filter(s => s !== tag) : [...d.styles, tag],
    }));
  };

  const handleSave = () => {
    onUpdateProfile(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 pt-8 pb-32 md:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Profile</h2>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full hover:border-gray-400 transition-all"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>

        {/* Avatar + name + bio */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-md mb-4 flex items-center justify-center">
            {!profile.name && <User size={28} className="text-white/80" />}
          </div>

          {editing ? (
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="Your name"
              className="text-xl font-bold text-gray-900 text-center bg-transparent border-b-2 border-gray-300 focus:border-gray-900 outline-none pb-0.5 mb-2 w-48"
            />
          ) : (
            <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name || 'Add your name'}</h3>
          )}

          {editing ? (
            <textarea
              value={draft.bio}
              onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
              placeholder="Add a short bio…"
              rows={2}
              className="text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 resize-none w-full max-w-xs mt-1"
            />
          ) : (
            <p className="text-sm text-gray-400 text-center mt-0.5">
              {profile.bio || 'Add a short bio'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-0 justify-center mb-8 py-5 border-y border-gray-100">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center flex-1 ${i > 0 ? 'border-l border-gray-100' : ''}`}>
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Sizes */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">My Sizes</h4>
          <div className="space-y-3">
            {[
              { key: 'topSize',    label: 'Top',    options: TOP_SIZES },
              { key: 'bottomSize', label: 'Bottom', options: BOTTOM_SIZES },
              { key: 'shoeSize',   label: 'Shoes',  options: SHOE_SIZES },
            ].map(({ key, label, options }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-14 flex-shrink-0">{label}</span>
                {editing ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setDraft(d => ({ ...d, [key]: opt }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          draft[key] === opt
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm font-medium px-3 py-1 rounded-lg ${profile[key] ? 'bg-gray-100 text-gray-800' : 'text-gray-300'}`}>
                    {profile[key] || 'Not set'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Style preferences */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Style Preferences</h4>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map(tag => {
              const selected = editing ? draft.styles.includes(tag) : profile.styles.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => editing && toggleStyle(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selected
                      ? 'bg-gray-900 text-white'
                      : editing
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400'
                  } ${!editing ? 'cursor-default' : ''}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {!editing && profile.styles.length === 0 && (
            <p className="text-sm text-gray-300 mt-2">Tap Edit to add your style preferences</p>
          )}
        </section>

        {/* Settings (placeholders) */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Settings</h4>
          <div className="space-y-1">
            {[
              { label: 'Notifications', sublabel: 'Coming soon' },
              { label: 'Privacy',       sublabel: 'Coming soon' },
              { label: 'Appearance',    sublabel: 'Coming soon' },
            ].map(({ label, sublabel }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{sublabel}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            ))}
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors group mt-2"
            >
              <LogOut size={15} className="text-red-400 group-hover:text-red-500" />
              <p className="text-sm font-medium text-red-400 group-hover:text-red-500">Sign out</p>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Root — WardrobeApp
   ───────────────────────────────────────────────────────────────────────────── */
export default function WardrobeApp() {
  const [user, setUser]                   = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [activeTab, setActiveTab]         = useState('wardrobe');
  const [selectedItem, setSelectedItem]   = useState(null);
  const [items, setItems]                 = useState([]);
  const [addStep, setAddStep]             = useState(null);
  const [addItemFile, setAddItemFile]     = useState(null);
  const [boards, setBoards]               = useState(['All']);
  const [boardMeta, setBoardMeta]         = useState({});
  const [profile, setProfile]             = useState({
    name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', styles: [],
  });
  const [pendingOutfitItem, setPendingOutfitItem] = useState(null);
  const [pendingTargetCollage, setPendingTargetCollage] = useState(null);
  const [savedOutfits, setSavedOutfits]   = useState([]);
  const [draftOutfits, setDraftOutfits]   = useState([]);
  const [likedItems, setLikedItems]       = useState(() => new Set());

  // ── Auth + data loading ──────────────────────────────────────────────────
  const loadUserData = async (uid) => {
    const [profileRes, itemsRes, boardsRes, outfitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('items').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('boards').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('outfits').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      setProfile({ name: p.name, bio: p.bio, topSize: p.top_size, bottomSize: p.bottom_size, shoeSize: p.shoe_size, styles: p.styles });
    }

    if (itemsRes.data) {
      const appItems = itemsRes.data.map(dbItemToApp);
      setItems(appItems);
      setLikedItems(new Set(appItems.filter(i => i.liked).map(i => i.id)));
    }

    if (boardsRes.data) {
      setBoards(['All', ...boardsRes.data.map(b => b.name)]);
      const meta = {};
      boardsRes.data.forEach(b => { if (b.description) meta[b.name] = { description: b.description }; });
      setBoardMeta(meta);
    }

    if (outfitsRes.data) {
      setSavedOutfits(outfitsRes.data.filter(o => !o.is_draft).map(dbOutfitToApp));
      setDraftOutfits(outfitsRes.data.filter(o => o.is_draft).map(dbOutfitToApp));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserData(session.user.id);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      else {
        setItems([]); setBoards(['All']); setBoardMeta({});
        setSavedOutfits([]); setDraftOutfits([]); setLikedItems(new Set());
        setProfile({ name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', styles: [] });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Board handlers ───────────────────────────────────────────────────────
  const handleDeleteBoard = async name => {
    setBoards(prev => prev.filter(b => b !== name));
    setBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
    if (user) await supabase.from('boards').delete().eq('user_id', user.id).eq('name', name);
  };

  const handleToggleItemBoard = async (itemId, board) => {
    let nextBoards;
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const inBoard = i.boards.includes(board);
      nextBoards = inBoard ? i.boards.filter(b => b !== board) : [...i.boards, board];
      return { ...i, boards: nextBoards };
    }));
    setSelectedItem(prev => {
      if (prev?.id !== itemId) return prev;
      const inBoard = prev.boards.includes(board);
      return { ...prev, boards: inBoard ? prev.boards.filter(b => b !== board) : [...prev.boards, board] };
    });
    if (user && nextBoards !== undefined) {
      await supabase.from('items').update({ board_names: nextBoards }).eq('id', itemId).eq('user_id', user.id);
    }
  };

  const handleCreateBoard = async (name, description) => {
    setBoards(prev => [...prev, name]);
    if (description) setBoardMeta(prev => ({ ...prev, [name]: { description } }));
    if (user) await supabase.from('boards').insert({ user_id: user.id, name, description: description || '' });
  };

  const handleEditBoard = async (oldName, newName, description) => {
    setBoards(prev => prev.map(b => b === oldName ? newName : b));
    setItems(prev => prev.map(i => ({ ...i, boards: i.boards.map(b => b === oldName ? newName : b) })));
    setBoardMeta(prev => {
      const next = { ...prev };
      delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
    if (user) {
      await supabase.from('boards').update({ name: newName, description: description || '' }).eq('user_id', user.id).eq('name', oldName);
      const affectedItems = items.filter(i => i.boards.includes(oldName));
      await Promise.all(affectedItems.map(i =>
        supabase.from('items').update({ board_names: i.boards.map(b => b === oldName ? newName : b) }).eq('id', i.id).eq('user_id', user.id)
      ));
    }
  };

  const handleDeleteItems = async (ids, board) => {
    if (board === 'All') {
      setItems(prev => prev.filter(i => !ids.has(i.id)));
      setLikedItems(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
      if (user) await supabase.from('items').delete().in('id', [...ids]).eq('user_id', user.id);
    } else {
      setItems(prev => prev.map(i => ids.has(i.id) ? { ...i, boards: i.boards.filter(b => b !== board) } : i));
      if (user) {
        const affectedItems = items.filter(i => ids.has(i.id));
        await Promise.all(affectedItems.map(i =>
          supabase.from('items').update({ board_names: i.boards.filter(b => b !== board) }).eq('id', i.id).eq('user_id', user.id)
        ));
      }
    }
  };

  // ── Item handlers ────────────────────────────────────────────────────────
  const toggleLike = async id => {
    const nowLiked = !likedItems.has(id);
    setLikedItems(prev => { const next = new Set(prev); nowLiked ? next.add(id) : next.delete(id); return next; });
    if (user) await supabase.from('items').update({ liked: nowLiked }).eq('id', id).eq('user_id', user.id);
  };

  const updateItem = async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    if (user) {
      const dbUpdates = {};
      if (updates.name      !== undefined) dbUpdates.name      = updates.name;
      if (updates.brand     !== undefined) dbUpdates.brand     = updates.brand;
      if (updates.price     !== undefined) dbUpdates.price     = updates.price;
      if (updates.size      !== undefined) dbUpdates.size      = updates.size;
      if (updates.material  !== undefined) dbUpdates.material  = updates.material;
      if (updates.color     !== undefined) dbUpdates.color     = updates.color;
      if (updates.category  !== undefined) dbUpdates.category  = updates.category;
      if (updates.notes     !== undefined) dbUpdates.notes     = updates.notes;
      if (Object.keys(dbUpdates).length) {
        await supabase.from('items').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      }
    }
  };

  const deleteItem = async id => {
    setItems(prev => prev.filter(i => i.id !== id));
    setLikedItems(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSelectedItem(null);
    if (user) await supabase.from('items').delete().eq('id', id).eq('user_id', user.id);
  };

  const updateItemImage = async (id, blob) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-edited.png`;
    const file = new File([blob], 'edited.png', { type: 'image/png' });
    const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadErr) { console.error('Image upload error:', uploadErr); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
    setItems(prev => prev.map(i => i.id === id ? { ...i, image: publicUrl } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, image: publicUrl } : prev);
    await supabase.from('items').update({ image_url: publicUrl }).eq('id', id).eq('user_id', user.id);
  };

  const addItem = async (form, imageFile) => {
    const tempId = `temp-${Date.now()}`;
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : '';
    setItems(prev => [{
      id: tempId, ...form, image: previewUrl, boards: [], liked: false, ratio: 'portrait',
      attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
      colorProfile: { primaryHex: '', colorFamily: '', undertone: 'Neutral', vibrancy: 'Muted' },
      _enriching: true,
    }, ...prev]);

    try {
      let imageUrl = '';
      if (imageFile && user) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, imageFile);
        if (!uploadErr) {
          imageUrl = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl;
        }
      }

      const { data: dbItem, error: dbErr } = await supabase.from('items').insert({
        user_id: user.id,
        name: form.name, brand: form.brand, price: form.price, size: form.size,
        material: form.material, color: form.color, category: form.category, notes: form.notes,
        image_url: imageUrl, liked: false, board_names: [],
        attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
        color_profile: { primaryHex: '', colorFamily: '', undertone: 'Neutral', vibrancy: 'Muted' },
      }).select().single();

      if (dbErr) throw dbErr;

      setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: dbItem.id, image: imageUrl || previewUrl } : i));

      const result = await enrichItem({
        imageUrl: imageUrl || null,
        imageFile: imageUrl ? null : imageFile,
        name: form.name, brand: form.brand, category: form.category, material: form.material, color: form.color,
      });

      setItems(prev => prev.map(i => i.id === dbItem.id ? { ...i, ...result, _enriching: false } : i));
      await supabase.from('items').update({ attributes: result.attributes, color_profile: result.colorProfile }).eq('id', dbItem.id);
    } catch (err) {
      console.error('addItem error:', err);
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, _enriching: false } : i));
    }
  };

  // ── Outfit handlers ──────────────────────────────────────────────────────
  const handleAddToOutfit = item => {
    setPendingOutfitItem(item);
    setPendingTargetCollage(null);
    setActiveTab('studio');
    setSelectedItem(null);
  };

  const handleOpenExistingCollage = (item, outfit, type) => {
    setPendingOutfitItem(item);
    setPendingTargetCollage({ id: outfit.id, type });
    setActiveTab('studio');
    setSelectedItem(null);
  };

  const handleSaveOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '', is_draft: false,
    }).select().single();
    if (data) setSavedOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const handleSaveDraftOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '', is_draft: true,
    }).select().single();
    if (data) setDraftOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const updateSavedOutfit = async (id, collage) => {
    setSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const updateDraftOutfit = async (id, collage) => {
    setDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const handleRemoveDraftOutfit = async id => {
    setDraftOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  const handleRemoveSavedOutfit = async id => {
    setSavedOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  // ── Profile handler ──────────────────────────────────────────────────────
  const handleUpdateProfile = async updates => {
    setProfile(updates);
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: updates.name, bio: updates.bio,
        top_size: updates.topSize, bottom_size: updates.bottomSize, shoe_size: updates.shoeSize,
        styles: updates.styles,
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('wardrobe');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'wardrobe': return (
        <WardrobeTab
          items={items}
          boards={boards}
          boardMeta={boardMeta}
          likedItems={likedItems}
          onSelectItem={setSelectedItem}
          onDeleteBoard={handleDeleteBoard}
          onEditBoard={handleEditBoard}
          onDeleteItems={handleDeleteItems}
          onCreateBoard={handleCreateBoard}
          onToggleItemBoard={handleToggleItemBoard}
          onAddItem={() => setAddStep('picker')}
        />
      );
      case 'today':   return <TodayTab />;
      case 'studio':  return (
        <StudioTab
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          onSaveOutfit={handleSaveOutfit}
          onSaveDraftOutfit={handleSaveDraftOutfit}
          onUpdateSavedOutfit={updateSavedOutfit}
          onUpdateDraftOutfit={updateDraftOutfit}
          onRemoveDraftOutfit={handleRemoveDraftOutfit}
          onRemoveSavedOutfit={handleRemoveSavedOutfit}
          pendingOutfitItem={pendingOutfitItem}
          pendingTargetCollage={pendingTargetCollage}
          onClearPendingOutfit={() => { setPendingOutfitItem(null); setPendingTargetCollage(null); }}
          items={items}
          boards={boards}
        />
      );
      case 'stylist': return <StylistTab />;
      case 'profile': return (
        <ProfileTab
          items={items}
          boards={boards}
          savedOutfits={savedOutfits}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onSignOut={handleSignOut}
        />
      );
      default: return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="flex h-screen bg-white overflow-hidden antialiased font-sans">

      {/* ────────────────────────────────────────────────
          Desktop Sidebar
          ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 xl:w-64 border-r border-gray-100 py-8 px-4 flex-shrink-0 bg-white">

        {/* Logo */}
        <div className="px-3 mb-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">
            est. 2024
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your digital wardrobe</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="mt-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors group ${
              activeTab === 'profile' ? 'bg-gray-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 flex-shrink-0 shadow-sm" />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-400">View profile</p>
            </div>
            <ChevronRight
              size={13}
              className="text-gray-300 ml-auto group-hover:text-gray-500 transition-colors"
            />
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────
          Main content area
          ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center justify-between px-5 pt-14 pb-3 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <Search size={15} className="text-gray-600" />
            </button>
            <button onClick={() => setActiveTab('profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-sm" />
          </div>
        </div>

        {/* Active tab */}
        {renderContent()}
      </main>

      {/* ────────────────────────────────────────────────
          Mobile bottom navigation
          ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        <div className="flex items-center justify-around px-2 pt-2 pb-6">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div
                  className={`w-12 h-7 flex items-center justify-center rounded-xl transition-all ${
                    active ? 'bg-gray-900' : ''
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.75}
                    className={active ? 'text-white' : 'text-gray-400'}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    active ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ────────────────────────────────────────────────
          Item detail modal
          ──────────────────────────────────────────────── */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          liked={likedItems.has(selectedItem.id)}
          onToggleLike={toggleLike}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onUpdateImage={updateItemImage}
          onAddToOutfit={handleAddToOutfit}
          onOpenCollage={handleOpenExistingCollage}
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          boards={boards}
          onToggleBoard={handleToggleItemBoard}
        />
      )}

      {addStep === 'picker' && (
        <AddMethodModal
          onClose={() => setAddStep(null)}
          onImageSelected={file => { setAddItemFile(file); setAddStep('form'); }}
        />
      )}

      {addStep === 'form' && (
        <AddItemModal
          onClose={() => { setAddStep(null); setAddItemFile(null); }}
          onAdd={addItem}
          initialImage={addItemFile}
        />
      )}
    </div>
  );
}
