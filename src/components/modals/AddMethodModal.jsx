import React, { useRef } from 'react';
import { X, ImageIcon, Link2, Camera } from 'lucide-react';
import { startBgRemoval } from '../../lib/image.js';

export function AddMethodModal({ onClose, onImageSelected, onLinkSelected }) {
  const fileInputRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelected(file, startBgRemoval(file));
  };

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

          <button
            onClick={onLinkSelected}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Link2 size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Add from link</span>
          </button>

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
