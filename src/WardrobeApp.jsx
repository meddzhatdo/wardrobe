/**
 * WardrobeApp.jsx
 * Phase 1 — UI Layout + Mock Data
 * Stack: React · Tailwind CSS · Lucide React
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Shirt, Wand2, Sparkles,
  X, Heart, Plus, Search, ChevronRight, Pencil, Trash2, Brush,
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
              { key: 'saved',  label: 'Saved',  count: savedOutfits.length },
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
                {view === 'saved' ? 'No saved collages yet' : 'No drafts yet'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
              {list.map(outfit => {
                const imgs = outfit.items.slice(0, 4);
                return (
                  <div key={outfit.id} onClick={() => onOpenCollage(outfit, view)} className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
                    {imgs.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wand2 size={16} className="text-gray-300" />
                      </div>
                    ) : imgs.length === 1 ? (
                      <img src={imgs[0].image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`grid h-full w-full ${imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
                        {imgs.map((item, i) => (
                          <div key={i} className="overflow-hidden">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
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
   ItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function ItemModal({ item, liked, onToggleLike, onClose, onUpdate, onDelete, onAddToOutfit, onOpenCollage, savedOutfits, draftOutfits }) {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollagePicker, setShowCollagePicker] = useState(false);
  const [draft, setDraft] = useState({
    name: item.name,
    brand: item.brand,
    price: item.price,
    category: item.category,
    size: item.size,
    material: item.material,
    notes: item.notes || '',
  });

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    onUpdate(item.id, draft);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setDraft({
      name: item.name, brand: item.brand, price: item.price,
      category: item.category, size: item.size, material: item.material,
      notes: item.notes || '',
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
        <div className="relative flex-shrink-0 h-72 md:h-80 bg-gray-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6">

            {/* Brand + name + like */}
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
              <button
                onClick={() => onToggleLike(item.id)}
                className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all flex-shrink-0 ${
                  liked ? 'bg-rose-50 border-rose-200' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <Heart size={15} className={liked ? 'text-rose-500 fill-rose-500' : 'text-gray-400'} />
              </button>
            </div>

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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCard
   ───────────────────────────────────────────────────────────────────────────── */
function GridCard({ item, onClick }) {
  return (
    <div
      className="cursor-pointer group"
      onClick={() => onClick(item)}
    >
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <div className="w-full aspect-square">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
function WardrobeTab({ items, boards, boardMeta, likedItems, onSelectItem, onDeleteBoard, onEditBoard, onDeleteItems }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState(null);
  const [editBoard, setEditBoard] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
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
                  {['Item', 'Board'].map(option => (
                    <button
                      key={option}
                      onClick={() => setAddMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
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
            <p className="text-sm text-gray-400 mt-1">Tap + to add your first piece</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
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
          <div className="flex items-center justify-between px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Organize Board</h2>
            <button
              onClick={exitOrganize}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
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

/* ─────────────────────────────────────────────────────────────────────────────
   CreateOutfitModal
   ───────────────────────────────────────────────────────────────────────────── */
function CreateOutfitModal({ initialItem, initialCanvasItems, onClose, onSave, onSaveDraft }) {
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(240);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingCid, setDraggingCid] = useState(null);
  const canvasRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const ITEM_SIZE = 128;

  useEffect(() => {
    if (!canvasRef.current) return;
    const base = initialCanvasItems || [];
    if (!initialItem) {
      if (base.length > 0) { setCanvasItems(base); setIsDirty(true); }
      return;
    }
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, (width  - ITEM_SIZE) / 2);
    const y = Math.max(0, (height - ITEM_SIZE) / 2);
    setCanvasItems([...base, { ...initialItem, _cid: `${initialItem.id}-${Date.now()}`, x, y }]);
    setIsDirty(true);
  }, []);

  const requestClose = () => {
    if (isDirty) setShowExitWarning(true);
    else onClose();
  };

  const filtered =
    activeFilter === 'All'
      ? ITEMS
      : ITEMS.filter(i => i.boards.includes(activeFilter));

  // Click-to-add: cascade items from top-left so they don't stack
  const addToCanvas = item => {
    const offset = (canvasItems.length % 8) * 24;
    setCanvasItems(prev => [
      ...prev,
      { ...item, _cid: `${item.id}-${Date.now()}`, x: 20 + offset, y: 20 + offset },
    ]);
    setIsDirty(true);
  };

  const removeFromCanvas = cid => {
    setCanvasItems(prev => prev.filter(i => i._cid !== cid));
    setIsDirty(true);
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
    const item = ITEMS.find(i => i.id === Number(e.dataTransfer.getData('itemId')));
    if (!item) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - ITEM_SIZE / 2, rect.width  - ITEM_SIZE));
    const y = Math.max(0, Math.min(e.clientY - rect.top  - ITEM_SIZE / 2, rect.height - ITEM_SIZE));
    setCanvasItems(prev => [...prev, { ...item, _cid: `${item.id}-${Date.now()}`, x, y }]);
    setIsDirty(true);
  };

  // ── Mouse drag: reposition items already on canvas ──
  const startItemDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    const item = canvasItems.find(i => i._cid === cid);
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    setDraggingCid(cid);

    const onMove = e => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, rect.width  - ITEM_SIZE));
      const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, rect.height - ITEM_SIZE));
      setCanvasItems(prev => prev.map(i => i._cid === cid ? { ...i, x, y } : i));
    };
    const onUp = () => {
      setDraggingCid(null);
      setIsDirty(true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Panel resize handle ──
  const startDrag = e => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMove = e => {
      const delta = startX - e.clientX;
      setPanelWidth(Math.min(480, Math.max(200, startWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={requestClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X size={16} className="text-gray-600" />
        </button>
        <p className="text-sm font-semibold text-gray-900 flex-1">New Outfit</p>
        <button
          onClick={() => { onSaveDraft(canvasItems); setIsDirty(false); }}
          disabled={canvasItems.length === 0}
          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save Draft
        </button>
        <button
          onClick={() => { onSave(canvasItems); onClose(); }}
          disabled={canvasItems.length === 0}
          className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>

      {/* Body — canvas left, wardrobe panel right */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ── Collage canvas ── */}
        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden border-b md:border-b-0 border-gray-100 transition-colors duration-150 ${isDragOver ? 'bg-gray-100' : 'bg-gray-50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Empty / drag-over hint */}
          {canvasItems.length === 0 && !isDragOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 select-none pointer-events-none">
              <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-3">
                <Plus size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">Drag pieces here or tap to add</p>
            </div>
          )}

          {/* Drop target indicator */}
          {isDragOver && (
            <div className="absolute inset-3 border-2 border-dashed border-gray-400 rounded-2xl pointer-events-none flex items-center justify-center">
              <p className="text-sm font-medium text-gray-400 select-none">Drop to place</p>
            </div>
          )}

          {/* Canvas items — absolutely positioned, draggable to reposition */}
          {canvasItems.map(item => (
            <div
              key={item._cid}
              style={{ left: item.x, top: item.y, width: ITEM_SIZE, height: ITEM_SIZE, zIndex: draggingCid === item._cid ? 10 : 1 }}
              className={`absolute group rounded-xl overflow-hidden bg-gray-200 select-none cursor-grab active:cursor-grabbing transition-shadow ${draggingCid === item._cid ? 'shadow-2xl' : 'shadow-sm'}`}
              onMouseDown={e => startItemDrag(e, item._cid)}
            >
              <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-cover pointer-events-none" />
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); removeFromCanvas(item._cid); }}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={9} strokeWidth={2.5} className="text-white" />
              </button>
            </div>
          ))}
        </div>

        {/* ── Resize handle (desktop only) ── */}
        <div
          onMouseDown={startDrag}
          className="hidden md:flex w-3 flex-shrink-0 items-center justify-center cursor-col-resize group bg-white border-x border-gray-100 hover:border-gray-300 transition-colors"
        >
          <div className="flex flex-col gap-[3px]">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-0.5 h-0.5 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors" />
            ))}
          </div>
        </div>

        {/* ── Mini wardrobe panel ── */}
        <div
          className="w-full flex flex-col flex-shrink-0 h-56 md:h-auto bg-white"
          style={window.innerWidth >= 768 ? { width: panelWidth } : undefined}
        >

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
                {BOARDS.map(board => {
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
            <div className="grid grid-cols-3 gap-1.5">
              {filtered.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  onClick={() => addToCanvas(item)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-75 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
                >
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-cover pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Exit warning overlay ── */}
      {showExitWarning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm backdrop-fade">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mx-6 max-w-xs w-full modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Discard outfit?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              You have unsaved changes. Save a draft to continue later, or discard and exit.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onSaveDraft(canvasItems); onClose(); }}
                className="w-full py-2.5 border border-gray-200 text-gray-800 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Save Draft & Exit
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => setShowExitWarning(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OutfitCard
   ───────────────────────────────────────────────────────────────────────────── */
function OutfitCard({ outfit }) {
  const imgs = outfit.items.slice(0, 4);
  const extra = outfit.items.length - 4;

  return (
    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative cursor-pointer group">
      {imgs.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <Wand2 size={20} className="text-gray-300" />
        </div>
      ) : imgs.length === 1 ? (
        <img src={imgs[0].image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
      ) : (
        <div className={`grid h-full w-full ${imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
          {imgs.map((item, i) => (
            <div key={i} className="overflow-hidden">
              <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
            </div>
          ))}
        </div>
      )}
      {extra > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          +{extra}
        </div>
      )}
    </div>
  );
}

function StudioTab({ savedOutfits, draftOutfits, onSaveOutfit, onSaveDraftOutfit, onUpdateSavedOutfit, onUpdateDraftOutfit, pendingOutfitItem, pendingTargetCollage, onClearPendingOutfit }) {
  const [showCreate, setShowCreate]         = useState(false);
  const [createSeed, setCreateSeed]         = useState(null);
  const [initialCanvasItems, setInitialCanvasItems] = useState(null);
  const [editingCollage, setEditingCollage] = useState(null);
  const [view, setView]                     = useState('saved');

  useEffect(() => {
    if (!pendingOutfitItem) return;
    setCreateSeed(pendingOutfitItem);
    if (pendingTargetCollage) {
      const list = pendingTargetCollage.type === 'saved' ? savedOutfits : draftOutfits;
      const outfit = list.find(o => o.id === pendingTargetCollage.id);
      setInitialCanvasItems(outfit?.items || []);
      setEditingCollage(pendingTargetCollage);
    } else {
      setInitialCanvasItems(null);
      setEditingCollage(null);
    }
    setShowCreate(true);
    onClearPendingOutfit();
  }, [pendingOutfitItem]);

  const list = view === 'saved' ? savedOutfits : draftOutfits;

  const emptyLabel = view === 'saved'
    ? { title: 'No saved outfits', sub: 'Tap + to create your first look' }
    : { title: 'No drafts', sub: 'Save a draft while building an outfit' };

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

          {/* Saved / Drafts toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit gap-1">
            {[
              { key: 'saved',  label: 'Saved',  count: savedOutfits.length  },
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
                <OutfitCard key={outfit.id} outfit={outfit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateOutfitModal
          initialItem={createSeed}
          initialCanvasItems={initialCanvasItems}
          onClose={() => { setShowCreate(false); setCreateSeed(null); setInitialCanvasItems(null); setEditingCollage(null); }}
          onSave={items => {
            if (editingCollage?.type === 'saved') onUpdateSavedOutfit(editingCollage.id, items);
            else onSaveOutfit(items);
          }}
          onSaveDraft={items => {
            if (editingCollage?.type === 'drafts') onUpdateDraftOutfit(editingCollage.id, items);
            else onSaveDraftOutfit(items);
          }}
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
   Root — WardrobeApp
   ───────────────────────────────────────────────────────────────────────────── */
export default function WardrobeApp() {
  const [activeTab, setActiveTab]         = useState('wardrobe');
  const [selectedItem, setSelectedItem]   = useState(null);
  const [items, setItems]                 = useState(ITEMS);
  const [boards, setBoards]               = useState(BOARDS);
  const [boardMeta, setBoardMeta]         = useState({});

  const handleDeleteBoard = name => {
    setBoards(prev => prev.filter(b => b !== name));
    setBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  const handleEditBoard = (oldName, newName, description) => {
    setBoards(prev => prev.map(b => b === oldName ? newName : b));
    setItems(prev => prev.map(i => ({
      ...i,
      boards: i.boards.map(b => b === oldName ? newName : b),
    })));
    setBoardMeta(prev => {
      const next = { ...prev };
      delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
  };

  const handleDeleteItems = (ids, board) => {
    if (board === 'All') {
      setItems(prev => prev.filter(i => !ids.has(i.id)));
      setLikedItems(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setItems(prev => prev.map(i =>
        ids.has(i.id) ? { ...i, boards: i.boards.filter(b => b !== board) } : i
      ));
    }
  };

  const [pendingOutfitItem, setPendingOutfitItem] = useState(null);
  const [pendingTargetCollage, setPendingTargetCollage] = useState(null);
  const [savedOutfits, setSavedOutfits]   = useState([]);
  const [draftOutfits, setDraftOutfits]   = useState([]);
  const [likedItems, setLikedItems]       = useState(
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

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  };

  const deleteItem = id => {
    setItems(prev => prev.filter(i => i.id !== id));
    setLikedItems(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSelectedItem(null);
  };

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

  const handleSaveOutfit = items => {
    if (items.length === 0) return;
    setSavedOutfits(prev => [{ id: Date.now(), items }, ...prev]);
  };

  const handleSaveDraftOutfit = items => {
    if (items.length === 0) return;
    setDraftOutfits(prev => [{ id: Date.now(), items }, ...prev]);
  };

  const updateSavedOutfit = (id, items) =>
    setSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, items } : o));

  const updateDraftOutfit = (id, items) =>
    setDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, items } : o));

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
          pendingOutfitItem={pendingOutfitItem}
          pendingTargetCollage={pendingTargetCollage}
          onClearPendingOutfit={() => { setPendingOutfitItem(null); setPendingTargetCollage(null); }}
        />
      );
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
          onUpdate={updateItem}
          onDelete={deleteItem}
          onAddToOutfit={handleAddToOutfit}
          onOpenCollage={handleOpenExistingCollage}
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
        />
      )}
    </div>
  );
}
