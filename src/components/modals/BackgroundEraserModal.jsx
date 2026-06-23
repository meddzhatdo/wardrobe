import React, { useState, useEffect, useRef } from 'react';
import { X, Undo2, Loader2, Brush } from 'lucide-react';

export function BackgroundEraserModal({ image, onSave, onClose }) {
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
