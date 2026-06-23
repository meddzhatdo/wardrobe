import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Loader2, Eraser } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants.js';
import { BackgroundEraserModal } from './BackgroundEraserModal.jsx';

export function AddItemModal({ onClose, onBack, onAdd, initialImage, imageProcessingPromise, initialForm = null, currencySymbol = '$' }) {
  const [imageFile, setImageFile] = useState(initialImage ?? null);
  const [previewUrl, setPreviewUrl] = useState(() => initialImage ? URL.createObjectURL(initialImage) : null);
  const [imageProcessing, setImageProcessing] = useState(!!imageProcessingPromise);
  const [showEraser, setShowEraser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', price: '', size: '', material: '', color: '',
    category: CATEGORIES[0], notes: '',
    ...(initialForm ?? {}),
  });

  // Resolve bg removal in background; swap preview when done
  useEffect(() => {
    if (!imageProcessingPromise) return;
    let cancelled = false;
    imageProcessingPromise
      .then(({ processedFile, bgRemoved }) => {
        if (cancelled) return;
        setImageFile(processedFile);
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(processedFile); });
        setImageProcessing(false);
        if (!bgRemoved) setBgFailed(true);
      })
      .catch(() => { if (!cancelled) setImageProcessing(false); });
    return () => { cancelled = true; };
  }, [imageProcessingPromise]);

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
    // Pass the promise if bg removal is still running — addItem will resolve it in the background
    onAdd(form, imageFile, imageProcessing ? imageProcessingPromise : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[440px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden modal-animate max-h-[92vh] flex flex-col">

        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft size={14} strokeWidth={2.5} className="text-gray-500" />
          </button>
        )}
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
            {imageProcessing ? (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-end justify-center pb-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                  <Loader2 size={12} className="animate-spin text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Removing background…</span>
                </div>
              </div>
            ) : bgFailed ? (
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-xs text-amber-700">Background removal failed — use the eraser to clean it up manually.</span>
                <button onClick={() => setShowEraser(true)} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900">
                  <Eraser size={11} /> Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowEraser(true)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
              >
                <Eraser size={13} />
                Edit background
              </button>
            )}
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
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-gray-400">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="0"
                    className={editInput}
                  />
                </div>
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
