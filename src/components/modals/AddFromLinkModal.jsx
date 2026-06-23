import React, { useState, useRef } from 'react';
import { ArrowLeft, X, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '../../supabase.js';
import { startBgRemoval } from '../../lib/image.js';

export function AddFromLinkModal({ onClose, onBack, onImageSelected, onScraped, initialStep = 'url', initialScraped = null }) {
  const [step,       setStep]       = useState(initialStep);
  const [url,        setUrl]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [scraped,    setScraped]    = useState(initialScraped);
  const [pickingIdx, setPickingIdx] = useState(null);
  const fileInputRef = useRef(null);

  const handleNext = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/scrape-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not fetch that page');
      setScraped(data);
      onScraped?.(data);
      setStep('images');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (imgUrl, idx) => {
    if (pickingIdx != null) return;
    setPickingIdx(idx);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) throw new Error('Could not load image');
      const blob = await res.blob();
      const file = new File([blob], 'product.jpg', { type: blob.type || 'image/jpeg' });
      onImageSelected(file, startBgRemoval(file), {
        name: scraped?.name || '',
        brand: scraped?.brand || '',
        price: scraped?.price || '',
        material: scraped?.material || '',
        size: scraped?.size || '',
      });
    } catch (err) {
      console.error('Image pick error:', err);
      setPickingIdx(null);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelected(file, startBgRemoval(file), {
      name: scraped?.name || '',
      brand: scraped?.brand || '',
      price: scraped?.price || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[360px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl modal-animate">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <button
          onClick={step === 'images' ? () => setStep('url') : onBack}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2.5} className="text-gray-500" />
        </button>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={14} strokeWidth={2.5} className="text-gray-500" />
        </button>

        {step === 'url' ? (
          <>
            <div className="px-6 pt-16 pb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add item</p>
              <h2 className="text-xl font-semibold text-gray-900 mt-1">Add from link</h2>
              <p className="text-sm text-gray-400 mt-1">Paste a product URL and we'll pull in the details for you.</p>
            </div>
            <div className="px-6 pb-10 pt-4 flex flex-col gap-3">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                autoFocus
              />
              {error && <p className="text-xs text-red-500 -mt-1 px-1">{error}</p>}
              <button
                onClick={handleNext}
                disabled={!url.trim() || loading}
                className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Next'}
              </button>
              {/* Extension download link — uncomment once published to the Chrome Web Store
              <a
                href="https://chrome.google.com/webstore/detail/wardrobe"
                target="_blank"
                rel="noreferrer"
                className="text-center text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                Get the Chrome extension for better results ↗
              </a>
              */}
            </div>
          </>
        ) : (
          <>
            <div className="px-6 pt-16 pb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add item</p>
              <h2 className="text-xl font-semibold text-gray-900 mt-1">Choose a photo</h2>
              <p className="text-sm text-gray-400 mt-1">
                {(scraped?.images?.length ?? 0) === 0
                  ? 'This site blocked image loading. Upload your own photo below.'
                  : 'Pick the best image, or upload your own.'}
              </p>
            </div>
            <div className="px-6 pb-10">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <ImageIcon size={24} className="text-gray-400" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {(scraped?.images ?? []).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePickImage(imgUrl, idx)}
                    disabled={pickingIdx != null}
                    className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0"
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                    {pickingIdx === idx && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-gray-700" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
