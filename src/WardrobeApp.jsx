/**
 * WardrobeApp.jsx
 * Phase 1 — UI Layout + Mock Data
 * Stack: React · Tailwind CSS · Lucide React
 */
import React, { useState, useEffect } from 'react';
import {
  Sun, Shirt, Wand2, Sparkles,
  X, Heart, Share2, Plus, Search, ChevronRight,
} from 'lucide-react';

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
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Data
   ───────────────────────────────────────────────────────────────────────────── */
const BOARDS = ['All', 'Workwear', 'Weekend', 'Evening', 'Basics', 'Outerwear'];

const ITEMS = [
  {
    id: 1,
    name: 'Oversized Linen Blazer',
    brand: 'Theory',
    price: '$485',
    material: '100% Belgian Linen',
    category: 'Outerwear',
    board: 'Workwear',
    color: 'Sand',
    size: 'S / 36',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 2,
    name: 'Silk Slip Dress',
    brand: 'Reformation',
    price: '$248',
    material: '100% Silk Charmeuse',
    category: 'Dresses',
    board: 'Evening',
    color: 'Ivory',
    size: 'XS',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
  },
  {
    id: 3,
    name: 'Achilles Low Sneaker',
    brand: 'Common Projects',
    price: '$495',
    material: 'Full-grain Leather',
    category: 'Footwear',
    board: 'Weekend',
    color: 'White',
    size: '38',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: false,
  },
  {
    id: 4,
    name: 'Cashmere Turtleneck',
    brand: 'Everlane',
    price: '$175',
    material: 'Grade-A Mongolian Cashmere',
    category: 'Tops',
    board: 'Basics',
    color: 'Camel',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 5,
    name: '90s Pinch Jeans',
    brand: 'AGOLDE',
    price: '$228',
    material: '100% Organic Cotton Denim',
    category: 'Bottoms',
    board: 'Weekend',
    color: 'Light Indigo',
    size: '26',
    image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
  },
  {
    id: 6,
    name: 'Westminster Trench',
    brand: 'Burberry',
    price: '$2,290',
    material: 'Cotton Gabardine',
    category: 'Outerwear',
    board: 'Outerwear',
    color: 'Honey',
    size: 'UK 8',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 7,
    name: 'Numéro Un Tote',
    brand: 'Polène',
    price: '$360',
    material: 'Suede Leather',
    category: 'Bags',
    board: 'Weekend',
    color: 'Caramel',
    size: 'OS',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: true,
  },
  {
    id: 8,
    name: 'Ribbed Modal Tank',
    brand: 'Toteme',
    price: '$120',
    material: '90% Modal, 10% Elastane',
    category: 'Tops',
    board: 'Basics',
    color: 'Off White',
    size: 'XS / S',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b02e0?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 9,
    name: 'Fluid Wide-Leg Trouser',
    brand: 'COS',
    price: '$155',
    material: '65% Viscose, 35% Linen',
    category: 'Bottoms',
    board: 'Workwear',
    color: 'Stone',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: false,
  },
  {
    id: 10,
    name: 'Nappa Ankle Boot',
    brand: 'ATP Atelier',
    price: '$380',
    material: 'Vegetable-tanned Nappa',
    category: 'Footwear',
    board: 'Evening',
    color: 'Cognac',
    size: '38',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: true,
  },
  {
    id: 11,
    name: 'Linen Popover Shirt',
    brand: 'Uniqlo',
    price: '$39.90',
    material: '100% French Linen',
    category: 'Tops',
    board: 'Basics',
    color: 'White',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 12,
    name: '101801 Camel Coat',
    brand: 'Max Mara',
    price: '$1,840',
    material: 'Camel Hair & Wool Blend',
    category: 'Outerwear',
    board: 'Outerwear',
    color: 'Camel',
    size: '38 IT',
    image: 'https://images.unsplash.com/photo-1583744946564-b432d563933f?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: true,
  },
  {
    id: 13,
    name: 'Pleated Satin Skirt',
    brand: 'Sandro',
    price: '$295',
    material: '100% Polyester Satin',
    category: 'Bottoms',
    board: 'Evening',
    color: 'Champagne',
    size: '36 FR',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5974ca5f59?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: false,
  },
  {
    id: 14,
    name: 'Tailored City Blazer',
    brand: 'Zara',
    price: '$99.90',
    material: 'Polyester Blend',
    category: 'Outerwear',
    board: 'Workwear',
    color: 'Black',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80',
    ratio: 'square',
    liked: false,
  },
  {
    id: 15,
    name: 'Chunky Knit Sweater',
    brand: 'Arket',
    price: '$169',
    material: '100% Lambswool',
    category: 'Tops',
    board: 'Basics',
    color: 'Oatmeal',
    size: 'S',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=500&q=80',
    ratio: 'portrait',
    liked: true,
  },
  {
    id: 16,
    name: 'Floral Chiffon Gown',
    brand: 'Self-Portrait',
    price: '$560',
    material: 'Silk Chiffon & Lace',
    category: 'Dresses',
    board: 'Evening',
    color: 'Floral Multi',
    size: 'US 6',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80',
    ratio: 'tall',
    liked: false,
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

function countByBoard(board) {
  return board === 'All' ? ITEMS.length : ITEMS.filter(i => i.board === board).length;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function ItemModal({ item, liked, onToggleLike, onClose }) {
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

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <X size={14} strokeWidth={2.5} className="text-gray-500" />
        </button>

        {/* Hero image — fixed height so content is always visible */}
        <div className="relative flex-shrink-0 h-72 md:h-80 bg-gray-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {/* Board badge on image */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
              {item.board}
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6">

            {/* Brand + actions row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
                  {item.brand}
                </p>
                <h2 className="text-xl font-semibold text-gray-900 leading-snug">{item.name}</h2>
              </div>
              <div className="flex gap-2 flex-shrink-0 pt-0.5">
                <button
                  onClick={() => onToggleLike(item.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                    liked
                      ? 'bg-rose-50 border-rose-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Heart
                    size={15}
                    className={liked ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}
                  />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  <Share2 size={15} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Price */}
            <p className="text-3xl font-light tracking-tight text-gray-900 mb-6">{item.price}</p>

            {/* Detail tiles */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { label: 'Category', value: item.category },
                { label: 'Board',    value: item.board    },
                { label: 'Color',    value: item.color    },
                { label: 'Size',     value: item.size     },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
              <div className="col-span-2 bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                  Material
                </p>
                <p className="text-sm font-medium text-gray-800">{item.material}</p>
              </div>
            </div>

            {/* Primary action */}
            <button className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-semibold tracking-wide hover:bg-gray-700 active:scale-[0.98] transition-all">
              Add to Outfit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCard
   ───────────────────────────────────────────────────────────────────────────── */
function GridCard({ item, liked, onLike, onClick }) {
  return (
    <div
      className="break-inside-avoid mb-3 cursor-pointer group"
      onClick={() => onClick(item)}
    >
      {/* Image tile */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <div className={`w-full ${RATIO[item.ratio] ?? 'aspect-[3/4]'}`}>
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        {/* Hover tint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/6 transition-colors duration-300 pointer-events-none" />

        {/* Like button — always visible if liked, else appears on hover */}
        <button
          onClick={e => { e.stopPropagation(); onLike(item.id); }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
            liked
              ? 'bg-white opacity-100 scale-100'
              : 'bg-white/80 backdrop-blur-sm opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
          }`}
        >
          <Heart
            size={13}
            className={liked ? 'text-rose-500 fill-rose-500' : 'text-gray-500'}
          />
        </button>

        {/* Board badge — appears on hover */}
        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-semibold bg-white/85 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full">
            {item.board}
          </span>
        </div>
      </div>

      {/* Item info */}
      <div className="mt-2 px-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
          {item.brand}
        </p>
        <p className="text-sm font-medium text-gray-800 leading-snug mt-0.5">{item.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{item.price}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WardrobeTab
   ───────────────────────────────────────────────────────────────────────────── */
function WardrobeTab({ likedItems, onToggleLike, onSelectItem }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered =
    activeFilter === 'All'
      ? ITEMS
      : ITEMS.filter(i => i.board === activeFilter);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab header ── */}
      <div className="px-5 md:px-7 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">My Wardrobe</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              {activeFilter !== 'All' && ` · ${activeFilter}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Search size={16} strokeWidth={2} className="text-gray-600" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm">
              <Plus size={17} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Board filter chips ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
          {BOARDS.map(board => {
            const active = activeFilter === board;
            return (
              <button
                key={board}
                onClick={() => setActiveFilter(board)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {board}
                <span className={`text-[11px] tabular-nums ${active ? 'text-gray-400' : 'text-gray-400'}`}>
                  {countByBoard(board)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Masonry grid ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Shirt size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-800">No items in this board</p>
            <p className="text-sm text-gray-400 mt-1">Tap + to add your first piece</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 xl:columns-4 gap-3">
            {filtered.map(item => (
              <GridCard
                key={item.id}
                item={item}
                liked={likedItems.has(item.id)}
                onLike={onToggleLike}
                onClick={onSelectItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Placeholder tabs (Today / Studio / AI Stylist)
   ───────────────────────────────────────────────────────────────────────────── */
function TodayTab() {
  const occasions = ['Morning Meeting', 'Lunch Catch-up', 'Evening Walk'];

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-6 md:px-10 pb-28 md:pb-8">
      <div className="pt-8 mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Today's Looks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Curated from your wardrobe</p>
      </div>

      {/* Weather strip */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-2xl mb-6 border border-amber-100">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sun size={20} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Sunny · 24°C</p>
          <p className="text-xs text-gray-500">Light layers recommended</p>
        </div>
      </div>

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

function StudioTab() {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-6 md:px-10 pb-28 md:pb-8">
      <div className="pt-8 mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Style Studio</h1>
        <p className="text-sm text-gray-400 mt-0.5">Build & save complete outfits</p>
      </div>

      {/* Canvas placeholder */}
      <div className="flex-1 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-64 mb-6">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
          <Wand2 size={24} className="text-violet-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Drag pieces here</p>
        <p className="text-xs text-gray-400 mt-1">Build your perfect look</p>
      </div>

      {/* Thumbnail grid skeleton */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Saved Outfits</p>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.18em]">
        Coming Soon
      </p>
    </div>
  );
}

function StylistTab() {
  const prompts = [
    'What should I wear to a rooftop dinner?',
    'Build a capsule wardrobe from my basics',
    'What's trending for autumn?',
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
   Root — WardrobeApp
   ───────────────────────────────────────────────────────────────────────────── */
export default function WardrobeApp() {
  const [activeTab, setActiveTab]     = useState('wardrobe');
  const [selectedItem, setSelectedItem] = useState(null);
  const [likedItems, setLikedItems]   = useState(
    () => new Set(ITEMS.filter(i => i.liked).map(i => i.id))
  );

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const toggleLike = id =>
    setLikedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderContent = () => {
    switch (activeTab) {
      case 'wardrobe': return (
        <WardrobeTab
          likedItems={likedItems}
          onToggleLike={toggleLike}
          onSelectItem={setSelectedItem}
        />
      );
      case 'today':   return <TodayTab />;
      case 'studio':  return <StudioTab />;
      case 'stylist': return <StylistTab />;
      default: return null;
    }
  };

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

        {/* Wardrobe stats widget */}
        <div className="mt-8 mx-0.5 p-4 bg-gray-50 rounded-2xl">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Wardrobe Stats
          </p>
          {[
            { label: 'Total Items', value: ITEMS.length },
            { label: 'Favourites',  value: likedItems.size },
            { label: 'Boards',      value: BOARDS.length - 1 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xs font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Profile */}
        <div className="mt-auto">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 flex-shrink-0 shadow-sm" />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900">Sofia M.</p>
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-sm" />
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
        />
      )}
    </div>
  );
}
