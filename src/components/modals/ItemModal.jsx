import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, Loader2, ImagePlus, Eraser, Trash2, Heart, Download, Layers, Check } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants.js';
import { startBgRemoval } from '../../lib/image.js';
import { AddToCollageModal } from './AddToCollageModal.jsx';
import { BackgroundEraserModal } from './BackgroundEraserModal.jsx';

export function ItemModal({ item, liked, onToggleLike, onClose, onUpdate, onDelete, onAddToOutfit, onOpenCollage, savedOutfits, draftOutfits, boards, onToggleBoard, onUpdateImage, isPreview = false, currencySymbol = '$' }) {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollagePicker, setShowCollagePicker] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const boardMenuRef = useRef(null);
  const imageInputRef = useRef(null);

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
    attributes: item.attributes || { warmthRating: 'none' },
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
      attributes: item.attributes || { warmthRating: 'none' },
    });
    setEditMode(false);
  };

  const handleImageFile = async (file) => {
    if (!file || !onUpdateImage) return;
    setImgUploading(true);
    try {
      const { processedFile } = await startBgRemoval(file);
      onUpdateImage(item.id, processedFile);
    } catch {
      onUpdateImage(item.id, file);
    } finally {
      setImgUploading(false);
    }
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

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && !isPreview && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-t-[2rem] md:rounded-[2rem]">
            <div className="bg-white rounded-2xl p-6 mx-6 shadow-2xl w-full max-w-xs">
              <p className="text-sm font-semibold text-gray-800 mb-1">Delete this item?</p>
              <p className="text-xs text-gray-500 mb-5">This action can't be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-200 bg-white text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Top-right button cluster */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {!isPreview && (editMode ? (
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
          ))}
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
            className={`w-full h-full object-contain transition-opacity ${imgUploading ? 'opacity-40' : 'opacity-100'}`}
          />
          {imgUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                <Loader2 size={13} className="animate-spin text-gray-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Processing…</span>
              </div>
            </div>
          )}
          {editMode && !imgUploading && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
              >
                <ImagePlus size={13} />
                Replace image
              </button>
              <button
                onClick={() => setShowEraser(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
              >
                <Eraser size={13} />
                Edit background
              </button>
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImageFile(f);
              e.target.value = '';
            }}
          />
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
              {!isPreview && (
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
              )}
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
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-light tracking-tight text-gray-400">{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0"
                  className={`${editInput} text-3xl font-light tracking-tight text-gray-900 pb-0.5 flex-1`}
                />
              </div>
            ) : (
              <p className="text-3xl font-light tracking-tight text-gray-900 mb-6">
                {item.price && !isNaN(parseFloat(item.price))
                  ? `${currencySymbol}${parseFloat(item.price).toLocaleString()}`
                  : item.price || '—'}
              </p>
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

                {!isPreview && (
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
