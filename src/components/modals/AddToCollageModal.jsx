import React, { useState } from 'react';
import { X, Plus, Wand2 } from 'lucide-react';

export function AddToCollageModal({ savedOutfits, draftOutfits, onClose, onCreateNew, onOpenCollage }) {
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
