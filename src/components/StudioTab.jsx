import React, { useState, useRef, useEffect } from 'react';
import {
  X, Plus, Check, Trash2, MoreHorizontal, GripVertical,
  Undo2, Redo2, Lock, Heart, Layers, Brush, Pencil,
  ChevronRight, SlidersHorizontal, Wand2, CheckCircle2,
} from 'lucide-react';
import { CATEGORIES } from '../lib/constants.js';
import { _trimCache, computeImageTrim, contentBounds } from '../lib/collage.jsx';

function CreateOutfitModal({ initialItem, initialCanvasItems, initialBgColor, initialDesignWidth, initialDesignHeight, onClose, onPublish, onAutoSave, onDetachCollage, onDelete, items = [], boards = ['All'] }) {
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [studioFilter, setStudioFilter] = useState(new Set());
  const [studioFilterOpen, setStudioFilterOpen] = useState(false);
  const studioFilterRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [wideLayout, setWideLayout] = useState(
    () => window.innerWidth >= 1250
  );
  const [draggingCid, setDraggingCid] = useState(null);
  const [selectedCid, setSelectedCid] = useState(null);
  const [bgColor, setBgColor] = useState(initialBgColor ?? '#FFFFFF');
  const [bgLayerSelected, setBgLayerSelected] = useState(false);
  const [hexInput, setHexInput] = useState((initialBgColor ?? '#FFFFFF').replace('#', ''));
  const [layerDragging, setLayerDragging] = useState(null);
  const [layerMenuState, setLayerMenuState] = useState(null);
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
  const [, trimTick] = useState(0);

  const ITEM_SIZE = 220;
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
    '#FFFFFF','#FFF3E0','#FFFDE7','#F1F8E9','#E3F2FD','#F3E5F5','#FCE4EC',
    '#F44336','#FF9800','#FFEB3B','#4CAF50','#2196F3','#9C27B0','#E91E63',
    '#B71C1C','#E65100','#F57F17','#1B5E20','#0D47A1','#4A148C','#880E4F',
    '#7B0000','#7C2900','#5D3A00','#0A3D0C','#0A1F5C','#1A0033','#000000',
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

    const applyLayout = (width, height) => {
      if (!initialItem) {
        if (base.length > 0) {
          if (initialDesignWidth && initialDesignHeight) {
            const sx = width  / initialDesignWidth;
            const sy = height / initialDesignHeight;
            setCanvasItems(base.map(item => ({
              ...item,
              x: Math.round(item.x * sx),
              y: Math.round(item.y * sy),
              w: Math.round((item.w ?? ITEM_SIZE) * sx),
              h: Math.round((item.h ?? ITEM_SIZE) * sy),
            })));
          } else {
            setCanvasItems(base);
          }
        }
        return;
      }
      const _cid = `${initialItem.id}-${Date.now()}`;
      computeImageTrim(initialItem.image).then(trim => {
        const { w, h } = contentBounds(trim, ITEM_SIZE);
        const x = Math.max(0, (width  - w) / 2);
        const y = Math.max(0, (height - h) / 2);
        setCanvasItems([...base, { ...initialItem, _cid, x, y, w, h, rotation: 0 }]);
      });
    };

    const { width, height } = canvasRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      applyLayout(width, height);
      return;
    }
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) { ro.disconnect(); applyLayout(w, h); }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const uncached = canvasItems.filter(i => i.image && !_trimCache.has(i.image));
    if (!uncached.length) return;
    let fired = false;
    Promise.all(uncached.map(i => computeImageTrim(i.image).then(() => { fired = true; })))
      .then(() => { if (fired) trimTick(n => n + 1); });
  }, [canvasItems]);

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

  const filtered = (() => {
    let list = activeFilter === 'All' ? items : items.filter(i => i.boards.includes(activeFilter));
    if (studioFilter.size > 0) list = list.filter(i => studioFilter.has(i.category));
    return list;
  })();

  const addToCanvas = item => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 480;
    const ch = rect?.height ?? 679;
    const offset = (canvasItems.length % 7) * 20;
    const _cid = `${item.id}-${Date.now()}`;
    pushHistory(canvasItems);
    computeImageTrim(item.image).then(trim => {
      const { w, h } = contentBounds(trim, ITEM_SIZE);
      const x = Math.max(0, Math.min((cw - w) / 2 - 60 + offset, cw - w));
      const y = Math.max(0, Math.min((ch - h) / 2 - 60 + offset, ch - h));
      setCanvasItems(prev => [...prev, { ...item, _cid, x, y, w, h, rotation: 0 }]);
    });
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
    if (!canvasRef.current?.contains(e.relatedTarget)) setIsDragOver(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    const item = items.find(i => i.id === Number(e.dataTransfer.getData('itemId')));
    if (!item) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;
    const _cid = `${item.id}-${Date.now()}`;
    pushHistory(canvasItems);
    computeImageTrim(item.image).then(trim => {
      const { w, h } = contentBounds(trim, ITEM_SIZE);
      const x = Math.max(0, Math.min(dropX - w / 2, rect.width  - w));
      const y = Math.max(0, Math.min(dropY - h / 2, rect.height - h));
      setCanvasItems(prev => [...prev, { ...item, _cid, x, y, w, h, rotation: 0 }]);
    });
  };

  const startItemDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCid(cid);
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
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
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target)) setLayerMenuState(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [layerMenuState]);

  useEffect(() => {
    if (!collageMenuOpen) return;
    const handler = e => {
      if (collageMenuRef.current && !collageMenuRef.current.contains(e.target)) setCollageMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [collageMenuOpen]);

  useEffect(() => {
    if (!studioFilterOpen) return;
    const handler = e => { if (!studioFilterRef.current?.contains(e.target)) setStudioFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [studioFilterOpen]);

  useEffect(() => {
    const check = () => setWideLayout(window.innerWidth >= 1250);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
                  onClick={() => { setCollageMenuOpen(false); onDelete?.(); onClose(); }}
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

      {/* Body */}
      <div className={`flex-1 relative ${wideLayout ? 'flex flex-row overflow-hidden' : 'grid grid-cols-2 overflow-y-auto'}`}>

        {/* Layers panel */}
        <div className={`flex flex-col flex-shrink-0 border-gray-100 bg-white overflow-hidden ${wideLayout ? 'w-72 border-r h-auto' : 'col-start-1 row-start-2 border-t border-r h-72'}`}>
          <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Layers</p>
          </div>

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

        {/* Color picker popup */}
        {bgLayerSelected && bgRowRef.current && (() => {
          const r = bgRowRef.current.getBoundingClientRect();
          const style = { top: r.top, left: r.right + 8 };
          return (
            <div className="fixed z-[60]" style={style}>
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

        {/* Item action toolbar */}
        {selectedCid && canvasRef.current && (() => {
          const item = canvasItems.find(i => i._cid === selectedCid);
          if (!item) return null;
          const cr = canvasRef.current.getBoundingClientRect();
          const w = item.w ?? ITEM_SIZE;
          const h = item.h ?? ITEM_SIZE;
          const toolbarW = 104;
          const toolbarH = 52;
          const pad = 8;
          const rawX = cr.left + item.x + w / 2;
          const clampedX = Math.max(cr.left + toolbarW / 2 + pad, Math.min(rawX, cr.right - toolbarW / 2 - pad));
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

        {/* Canvas viewport */}
        <div
          className={`flex items-center justify-center overflow-hidden bg-white ${wideLayout ? 'flex-1 p-8' : 'col-span-2 row-start-1 p-4 min-h-[50vh]'}`}
          onClick={() => { setSelectedCid(null); setBgLayerSelected(false); }}
        >
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
            {isDragOver && (
              <div className="absolute inset-3 border-2 border-dashed border-gray-400 rounded-2xl pointer-events-none flex items-center justify-center">
                <p className="text-sm font-medium text-gray-400 select-none">Drop to place</p>
              </div>
            )}

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
                    zIndex: draggingCid === item._cid ? 1000 : isSelected ? 500 : (item.zIndex ?? idx + 1),
                  }}
                  className="absolute group select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={e => startItemDrag(e, item._cid)}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className={`w-full h-full overflow-hidden ${isSelected ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
                    style={item.flipX ? { transform: 'scaleX(-1)' } : undefined}
                  >
                    {(() => {
                      const trim = _trimCache.get(item.image) ?? null;
                      const canCrop = !item._aiLayout && trim && trim.nw && trim.nh &&
                        Math.abs(item.w / item.h - (trim.fw * trim.nw) / (trim.fh * trim.nh)) < 0.05;
                      return canCrop ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          draggable={false}
                          className="pointer-events-none"
                          style={{
                            position: 'absolute',
                            width:  `${100 / trim.fw}%`,
                            height: `${100 / trim.fh}%`,
                            left:   `${-trim.fx / trim.fw * 100}%`,
                            top:    `${-trim.fy / trim.fh * 100}%`,
                          }}
                        />
                      ) : (
                        <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                      );
                    })()}
                  </div>
                  {isSelected && (
                    <>
                      <div
                        style={{ top: -28, left: '50%', transform: 'translateX(-50%)' }}
                        className="absolute w-5 h-5 bg-white border-2 border-blue-400 rounded-full cursor-crosshair shadow z-10"
                        onMouseDown={e => { e.stopPropagation(); startRotateDrag(e, item._cid); }}
                      />
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

        {/* Mini wardrobe panel */}
        <div className={`flex flex-col flex-shrink-0 bg-white border-gray-100 ${wideLayout ? 'h-auto w-[480px] border-l' : 'col-start-2 row-start-2 h-72 border-t overflow-hidden'}`}>

          <div className="relative flex-shrink-0 border-b border-gray-100 px-3 py-2.5" ref={studioFilterRef}>
            <button
              onClick={() => setStudioFilterOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors w-full ${
                studioFilter.size > 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={11} />
              Filter{studioFilter.size > 0 ? ` · ${studioFilter.size}` : ''}
            </button>
            {studioFilterOpen && (
              <div className="absolute left-3 right-3 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 max-h-48 overflow-y-auto scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setStudioFilter(prev => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; })}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className={studioFilter.has(cat) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{cat}</span>
                    {studioFilter.has(cat) && <Check size={13} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                  </button>
                ))}
                {studioFilter.size > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setStudioFilter(new Set()); setStudioFilterOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

  const sorted = [...items].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const bitmaps = await Promise.all(
    sorted.map(async item => {
      try {
        const res = await fetch(item.image);
        if (!res.ok) return null;
        return createImageBitmap(await res.blob());
      } catch { return null; }
    })
  );

  sorted.forEach((item, idx) => {
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

function OutfitOrganizeCard({ outfit, draggedId, selected, onSelect, onDragStart, onDragHover, onDragEnd }) {
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={e => {
        e.preventDefault();
        if (draggedId === outfit.id) return;
        onDragHover(outfit.id);
      }}
      onDrop={e => e.preventDefault()}
      onDragEnd={onDragEnd}
      style={{ aspectRatio: '210 / 297', ...bgStyle }}
      className={`relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        draggedId === outfit.id ? 'opacity-40' : ''
      } ${selected ? 'ring-[3px] ring-gray-900' : ''}`}
    >
      {outfit.thumbnail ? (
        <img src={outfit.thumbnail} alt={outfit.name || 'Outfit'} className="w-full h-full object-cover pointer-events-none" />
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
              zIndex: item.zIndex ?? idx + 1,
            }}
          >
            <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
          </div>
        );
      })}
      {selected && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
    </div>
  );
}

function OutfitCard({
  outfit, onDelete, onEdit, onDuplicate, onLogWorn, isDraft, liked, outfitBoards, organizeMode, dragging,
  onToggleLike, onToggleBoard, onDragStart, onDragOver, onDragEnd, isPreview = false,
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [wornState, setWornState] = useState('idle');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);

  const triggerDelete = () => {
    setExiting(true);
    setTimeout(() => onDelete?.(), 280);
  };
  const loadedCountRef = useRef(0);
  const dotsRef      = useRef(null);
  const dropdownRef  = useRef(null);
  const boardBtnRef  = useRef(null);
  const boardDropRef = useRef(null);
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };

  const handleItemImgLoad = () => {
    loadedCountRef.current++;
    if (loadedCountRef.current >= items.length) setImgLoaded(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (!dotsRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!boardMenuOpen) { setBoardSearch(''); return; }
    const handler = e => {
      if (!boardBtnRef.current?.contains(e.target) && !boardDropRef.current?.contains(e.target)) setBoardMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  return (
    <div
      className={`group relative cursor-pointer ${organizeMode ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging ? 'opacity-40' : ''} ${exiting ? 'card-exit' : ''}`}
      style={{ aspectRatio: '210 / 297' }}
      draggable={organizeMode}
      onDragStart={organizeMode ? onDragStart : undefined}
      onDragOver={organizeMode ? onDragOver : undefined}
      onDragEnd={organizeMode ? onDragEnd : undefined}
      onMouseLeave={() => { if (!boardMenuOpen) setBoardMenuOpen(false); }}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={bgStyle}>
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
                left:   `${(item.x / canvasWidth) * 100}%`,
                top:    `${(item.y / canvasHeight) * 100}%`,
                width:  `${(w / canvasWidth) * 100}%`,
                height: `${(h / canvasHeight) * 100}%`,
                transform: item.flipX ? `rotate(${rot}deg) scaleX(-1)` : `rotate(${rot}deg)`,
                zIndex: item.zIndex ?? idx + 1,
              }}
            >
              <img src={item.image} alt={item.name} draggable={false} onLoad={handleItemImgLoad} className="w-full h-full object-contain pointer-events-none" />
            </div>
          );
        })}
        {items.length > 0 && (
          <div className={`absolute inset-0 bg-gray-200 z-20 transition-opacity duration-500 ${imgLoaded ? 'opacity-0 pointer-events-none' : 'animate-pulse'}`} />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none z-10" />
      </div>

      {!organizeMode && (
        <button
          onClick={e => { e.stopPropagation(); onToggleLike?.(); }}
          className={`absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all ${liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <Heart size={13} strokeWidth={2} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} />
        </button>
      )}

      {boardMenuOpen && (
        <div ref={boardDropRef} className="absolute bottom-12 right-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-52 z-30">
          <p className="px-3 pt-1 pb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Move to Board</p>
          <div className="px-2 pb-1.5">
            <input
              autoFocus
              value={boardSearch}
              onChange={e => setBoardSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Search boards…"
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-400"
            />
          </div>
          {(() => {
            const visible = (outfitBoards ?? []).filter(b => b !== 'All' && b.toLowerCase().includes(boardSearch.toLowerCase()));
            if (visible.length === 0) return <p className="px-3 py-2 text-xs text-gray-400">{boardSearch ? 'No matches' : 'No boards yet'}</p>;
            return (
              <div className="overflow-y-auto max-h-[96px]">
                {visible.map(board => {
                  const inBoard = (outfit.boards ?? []).includes(board);
                  return (
                    <button
                      key={board}
                      onClick={e => { e.stopPropagation(); onToggleBoard?.(board); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate">{board}</span>
                      {inBoard && <Check size={13} strokeWidth={2.5} className="text-gray-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {!organizeMode && (
        <>
          {!isPreview && onLogWorn && (
            <div className="absolute bottom-2 left-2 z-10">
              <div className="relative">
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    const itemIds = items.map(i => String(i.id)).filter(Boolean);
                    if (!itemIds.length) return;
                    await onLogWorn({ itemIds, outfitId: outfit.id, source: 'studio_collage' });
                    setWornState('saved');
                    setTimeout(() => setWornState('idle'), 2000);
                  }}
                  className={`peer px-2.5 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
                    wornState === 'saved' ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {wornState === 'saved'
                    ? <Check size={13} className="text-green-500" />
                    : <CheckCircle2 size={13} className="text-gray-700" />
                  }
                </button>
                <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-30">
                  {wornState === 'saved' ? 'Logged!' : 'I Wore This'}
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
            {!isPreview && (
              <div ref={boardBtnRef} className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setBoardMenuOpen(o => !o); }}
                  className="peer px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <Layers size={13} className="text-gray-700" />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-30">
                  Boards
                </span>
              </div>
            )}

            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); onEdit?.(); }}
                className="peer px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
              >
                <Pencil size={13} className="text-gray-700" />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-30">
                Edit
              </span>
            </div>

            <div ref={dotsRef} className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                className="peer px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal size={16} className="text-gray-700" />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-30">
                More
              </span>
              {menuOpen && (
                <div ref={dropdownRef} className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1 w-40 z-20 overflow-hidden">
                  <button
                    onClick={async e => { e.stopPropagation(); setMenuOpen(false); setSaving(true); try { await saveCollageAsPng(outfit); } finally { setSaving(false); } }}
                    disabled={saving}
                    className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save to device'}
                  </button>
                  {!isPreview && (
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); onDuplicate?.(); }}
                      className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Duplicate
                    </button>
                  )}
                  {!isPreview && (
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); triggerDelete(); }}
                      className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function StudioTab({
  savedOutfits, draftOutfits, onSaveOutfit, onSaveDraftOutfit,
  onUpdateSavedOutfit, onUpdateDraftOutfit, onRemoveDraftOutfit, onRemoveSavedOutfit,
  pendingOutfitItem, pendingTargetCollage, onClearPendingOutfit,
  pendingAiCollage, onClearPendingAiCollage, items, boards,
  outfitBoards, outfitBoardMeta, likedOutfits,
  onCreateOutfitBoard, onDeleteOutfitBoard, onEditOutfitBoard, onToggleOutfitBoard, onToggleOutfitLike,
  onLogWorn,
  isPreview = false, previewCollages = [], userId = null,
}) {
  const [showCreate, setShowCreate]               = useState(false);
  const [createSeed, setCreateSeed]               = useState(null);
  const [initialCanvasItems, setInitialCanvasItems] = useState(null);
  const [initialBgColor, setInitialBgColor]       = useState(null);
  const [initialDesignWidth,  setInitialDesignWidth]  = useState(null);
  const [initialDesignHeight, setInitialDesignHeight] = useState(null);
  const [editingCollage, setEditingCollage]       = useState(null);

  const [activeOutfitFilter,  setActiveOutfitFilter]  = useState('All');
  const [outfitFavoritesOnly, setOutfitFavoritesOnly] = useState(false);
  const [newBoardOpen,   setNewBoardOpen]   = useState(false);
  const [newBoardName,   setNewBoardName]   = useState('');
  const [newBoardDesc,   setNewBoardDesc]   = useState('');
  const [editBoard,      setEditBoard]      = useState(null);
  const [editName,       setEditName]       = useState('');
  const [editDesc,       setEditDesc]       = useState('');
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState(null);
  const [boardMenuOpen,  setBoardMenuOpen]  = useState(false);
  const [addMenuOpen,    setAddMenuOpen]    = useState(false);
  const [organizeMode,   setOrganizeMode]   = useState(false);
  const [organizedList,  setOrganizedList]  = useState([]);
  const [draggedId,      setDraggedId]      = useState(null);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState(new Set());
  const [showDeleteOrganizeConfirm, setShowDeleteOrganizeConfirm] = useState(false);
  const [organizeBoardPickerOpen, setOrganizeBoardPickerOpen] = useState(false);
  const [pendingOrganizeAdd, setPendingOrganizeAdd] = useState(null);
  const boardMenuRef           = useRef(null);
  const addMenuRef             = useRef(null);
  const organizeBoardPickerRef = useRef(null);
  const [addToBoardMode, setAddToBoardMode] = useState(false);
  const [addToBoardSelectedIds, setAddToBoardSelectedIds] = useState(new Set());

  useEffect(() => {
    if (!pendingOutfitItem) return;
    setCreateSeed(pendingOutfitItem);
    if (pendingTargetCollage) {
      const list = pendingTargetCollage.type === 'saved' ? savedOutfits : draftOutfits;
      const outfit = list.find(o => o.id === pendingTargetCollage.id);
      setInitialCanvasItems(outfit?.items || []);
      setInitialBgColor(outfit?.bgColor ?? null);
      setInitialDesignWidth(outfit?.canvasWidth ?? null);
      setInitialDesignHeight(outfit?.canvasHeight ?? null);
      setEditingCollage(pendingTargetCollage);
    } else {
      setInitialCanvasItems(null);
      setInitialBgColor(null);
      setInitialDesignWidth(null);
      setInitialDesignHeight(null);
      setEditingCollage(null);
    }
    setShowCreate(true);
    onClearPendingOutfit();
  }, [pendingOutfitItem]);

  useEffect(() => {
    if (!pendingAiCollage) return;
    setCreateSeed(null);
    setInitialCanvasItems(pendingAiCollage.items);
    setInitialBgColor(pendingAiCollage.bgColor ?? '#FFFFFF');
    setInitialDesignWidth(pendingAiCollage.canvasWidth ?? null);
    setInitialDesignHeight(pendingAiCollage.canvasHeight ?? null);
    setEditingCollage(null);
    setShowCreate(true);
    onClearPendingAiCollage();
  }, [pendingAiCollage]);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = e => { if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!organizeBoardPickerOpen) return;
    const handler = e => { if (!organizeBoardPickerRef.current?.contains(e.target)) setOrganizeBoardPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [organizeBoardPickerOpen]);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => { if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  const draftIds = new Set(draftOutfits.map(o => o.id));

  const applyFilters = list => {
    let l = list;
    if (activeOutfitFilter !== 'All') l = l.filter(o => (o.boards ?? []).includes(activeOutfitFilter));
    if (outfitFavoritesOnly) l = l.filter(o => likedOutfits.has(o.id));
    return l;
  };

  const studioOrderKey = `studio-order-${userId || 'guest'}-${activeOutfitFilter}-${outfitFavoritesOnly ? 'fav' : 'all'}`;

  const orderedCombined = (() => {
    const combined = [
      ...applyFilters(draftOutfits),
      ...applyFilters(isPreview ? previewCollages : savedOutfits),
    ];
    try {
      const saved = localStorage.getItem(studioOrderKey);
      if (saved) {
        const ids = JSON.parse(saved);
        const idMap = new Map(combined.map(o => [o.id, o]));
        const ordered = ids.flatMap(id => idMap.has(id) ? [idMap.get(id)] : []);
        const seenIds = new Set(ids);
        const newItems = combined.filter(o => !seenIds.has(o.id));
        return [...newItems, ...ordered];
      }
    } catch {}
    return combined;
  })();

  const filteredDrafts = orderedCombined.filter(o => draftIds.has(o.id));
  const filteredSaved  = orderedCombined.filter(o => !draftIds.has(o.id));

  const openCollageForEditing = (outfit, type) => {
    setCreateSeed(null);
    setInitialCanvasItems(outfit.items || []);
    setInitialBgColor(outfit.bgColor ?? null);
    setInitialDesignWidth(outfit.canvasWidth ?? null);
    setInitialDesignHeight(outfit.canvasHeight ?? null);
    setEditingCollage({ id: outfit.id, type });
    setShowCreate(true);
  };

  const enterOrganize = () => {
    setOrganizedList([...filteredDrafts, ...filteredSaved]);
    setSelectedOutfitIds(new Set());
    setOrganizeMode(true);
  };

  const exitOrganize = () => {
    try {
      localStorage.setItem(studioOrderKey, JSON.stringify(organizedList.map(o => o.id)));
    } catch {}
    setOrganizeMode(false);
    setOrganizedList([]);
    setSelectedOutfitIds(new Set());
    setDraggedId(null);
  };

  const toggleSelectOutfit = id => {
    setSelectedOutfitIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const enterAddToBoard = () => { setAddToBoardSelectedIds(new Set()); setAddToBoardMode(true); };
  const exitAddToBoard = () => { setAddToBoardMode(false); setAddToBoardSelectedIds(new Set()); };
  const confirmAddToBoard = () => {
    addToBoardSelectedIds.forEach(id => onToggleOutfitBoard(id, activeOutfitFilter));
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };
  const toggleAddBoardOutfit = id => {
    setAddToBoardSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOrganizeDragHover = targetId => {
    if (!draggedId || targetId === draggedId) return;
    setOrganizedList(prev => {
      const from = prev.findIndex(o => o.id === draggedId);
      const to   = prev.findIndex(o => o.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">

        <div className="px-5 md:px-7 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Style Studio</h1>
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
                    onClick={() => { setAddMenuOpen(false); setShowCreate(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Outfit
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-3xl font-semibold text-gray-900 truncate max-w-[20ch]">{activeOutfitFilter}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeOutfitFilter !== 'All' && (
                <div className="relative" ref={boardMenuRef}>
                  <button
                    onClick={() => setBoardMenuOpen(o => !o)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xl leading-none"
                  >
                    ···
                  </button>
                  {boardMenuOpen && (
                    <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-20">
                      <button
                        onClick={() => {
                          setBoardMenuOpen(false);
                          setEditBoard(activeOutfitFilter);
                          setEditName(activeOutfitFilter);
                          setEditDesc(outfitBoardMeta?.[activeOutfitFilter]?.description ?? '');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit board
                      </button>
                      {!isPreview && (
                        <button
                          onClick={() => { setBoardMenuOpen(false); enterAddToBoard(); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Add to board
                        </button>
                      )}
                      <button
                        onClick={() => { setBoardMenuOpen(false); setDeleteConfirmBoard(activeOutfitFilter); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                      >
                        Delete board
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={enterOrganize}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Brush size={14} strokeWidth={2} />
                Organize
              </button>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm text-gray-400 mt-0.5">{filteredDrafts.length + filteredSaved.length} outfit{filteredDrafts.length + filteredSaved.length !== 1 ? 's' : ''}</p>
            <div className="min-h-[1.25rem] mt-0.5">
              {activeOutfitFilter !== 'All' && outfitBoardMeta?.[activeOutfitFilter]?.description && (
                <p className="text-sm text-gray-400 italic pl-3">{outfitBoardMeta[activeOutfitFilter].description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
            {(outfitBoards ?? ['All']).map(board => {
              const active = activeOutfitFilter === board;
              return (
                <button
                  key={board}
                  onClick={() => setActiveOutfitFilter(board)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-base font-medium transition-colors pb-0.5 ${
                    active ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent'
                  }`}
                >
                  {board}
                </button>
              );
            })}
          </div>

          <div className="pb-3">
            <button
              onClick={() => setOutfitFavoritesOnly(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                outfitFavoritesOnly ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Heart size={13} className={outfitFavoritesOnly ? 'fill-rose-500' : ''} />
              Favorites
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
          {filteredDrafts.length === 0 && filteredSaved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Wand2 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No outfits yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap + to create your first collage</p>
            </div>
          ) : (
            <>
              {filteredDrafts.length > 0 && (
                <div className="mb-6">
                  <p className="text-xl font-semibold text-gray-800 mb-3">Drafts ({filteredDrafts.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredDrafts.map(outfit => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        isDraft={true}
                        isPreview={isPreview}
                        liked={likedOutfits.has(outfit.id)}
                        outfitBoards={outfitBoards ?? ['All']}
                        onEdit={() => openCollageForEditing(outfit, 'drafts')}
                        onDelete={() => onRemoveDraftOutfit(outfit.id)}
                        onDuplicate={() => {
                          const copy = { items: outfit.items, bgColor: outfit.bgColor, canvasWidth: outfit.canvasWidth, canvasHeight: outfit.canvasHeight, name: outfit.name ? `${outfit.name} (copy)` : '', thumbnail: outfit.thumbnail || '' };
                          onSaveDraftOutfit(copy);
                        }}
                        onLogWorn={onLogWorn}
                        onToggleLike={() => onToggleOutfitLike(outfit.id)}
                        onToggleBoard={board => onToggleOutfitBoard(outfit.id, board)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {filteredSaved.length > 0 && (
                <div>
                  <p className="text-xl font-semibold text-gray-800 mb-3">Published ({filteredSaved.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredSaved.map(outfit => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        isDraft={false}
                        isPreview={isPreview}
                        liked={likedOutfits.has(outfit.id)}
                        outfitBoards={outfitBoards ?? ['All']}
                        onEdit={() => openCollageForEditing(outfit, 'saved')}
                        onDelete={() => onRemoveSavedOutfit?.(outfit.id)}
                        onDuplicate={() => {
                          const copy = { items: outfit.items, bgColor: outfit.bgColor, canvasWidth: outfit.canvasWidth, canvasHeight: outfit.canvasHeight, name: outfit.name ? `${outfit.name} (copy)` : '', thumbnail: outfit.thumbnail || '' };
                          onSaveOutfit(copy);
                        }}
                        onLogWorn={onLogWorn}
                        onToggleLike={() => onToggleOutfitLike(outfit.id)}
                        onToggleBoard={board => onToggleOutfitBoard(outfit.id, board)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Organize mode overlay */}
      {organizeMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Organize Outfits</h2>
            <button
              onClick={() => {
                const allSelected = selectedOutfitIds.size > 0;
                setSelectedOutfitIds(allSelected ? new Set() : new Set(organizedList.map(o => o.id)));
              }}
              className="absolute left-5 md:left-7 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {selectedOutfitIds.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={exitOrganize}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {organizedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Wand2 size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No outfits here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {organizedList.map(outfit => (
                  <OutfitOrganizeCard
                    key={outfit.id}
                    outfit={outfit}
                    draggedId={draggedId}
                    selected={selectedOutfitIds.has(outfit.id)}
                    onSelect={() => toggleSelectOutfit(outfit.id)}
                    onDragStart={() => setDraggedId(outfit.id)}
                    onDragHover={handleOrganizeDragHover}
                    onDragEnd={() => setDraggedId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none z-10">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {selectedOutfitIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{selectedOutfitIds.size} selected</span>
              )}
              <div className="relative" ref={organizeBoardPickerRef}>
                <div className="relative group">
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                    selectedOutfitIds.size > 0 && !organizeBoardPickerOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                  }`}>
                    <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Move to board</span>
                  </div>
                  <button
                    disabled={selectedOutfitIds.size === 0}
                    onClick={() => setOrganizeBoardPickerOpen(o => !o)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      selectedOutfitIds.size > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Layers size={18} />
                  </button>
                </div>
                {organizeBoardPickerOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-10">
                    {(outfitBoards ?? []).filter(b => b !== 'All').length === 0 && (
                      <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                    )}
                    {(outfitBoards ?? []).filter(b => b !== 'All').map(board => {
                      const selectedArr = organizedList.filter(o => selectedOutfitIds.has(o.id));
                      const allInBoard = selectedArr.length > 0 && selectedArr.every(o => (o.boards ?? []).includes(board));
                      return (
                        <button
                          key={board}
                          onClick={() => {
                            const toAdd = organizedList.filter(o =>
                              selectedOutfitIds.has(o.id) && !(o.boards ?? []).includes(board)
                            );
                            toAdd.forEach(o => onToggleOutfitBoard(o.id, board));
                            if (toAdd.length > 0) {
                              setOrganizedList(prev => prev.map(o =>
                                toAdd.some(t => t.id === o.id)
                                  ? { ...o, boards: [...(o.boards ?? []), board] }
                                  : o
                              ));
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {board}
                          {allInBoard && <Check size={13} strokeWidth={2.5} className="text-gray-500" />}
                        </button>
                      );
                    })}
                    {!isPreview && (
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setPendingOrganizeAdd(new Set(selectedOutfitIds));
                            setOrganizeBoardPickerOpen(false);
                            setNewBoardName('');
                            setNewBoardDesc('');
                            setNewBoardOpen(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          New board…
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative group">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                  selectedOutfitIds.size > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">{activeOutfitFilter === 'All' ? 'Delete' : 'Remove'}</span>
                </div>
                <button
                  disabled={selectedOutfitIds.size === 0}
                  onClick={() => setShowDeleteOrganizeConfirm(true)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedOutfitIds.size > 0
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {showDeleteOrganizeConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteOrganizeConfirm(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {activeOutfitFilter === 'All'
                    ? `Delete ${selectedOutfitIds.size} outfit${selectedOutfitIds.size !== 1 ? 's' : ''}?`
                    : `Remove ${selectedOutfitIds.size} outfit${selectedOutfitIds.size !== 1 ? 's' : ''} from board?`}
                </h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {activeOutfitFilter === 'All'
                    ? `${selectedOutfitIds.size === 1 ? 'This outfit' : 'These outfits'} will be permanently removed.`
                    : `${selectedOutfitIds.size === 1 ? 'This outfit' : 'These outfits'} will be removed from "${activeOutfitFilter}" but kept in your studio.`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const toDelete = new Set(selectedOutfitIds);
                      if (activeOutfitFilter === 'All') {
                        toDelete.forEach(id => {
                          if (draftIds.has(id)) onRemoveDraftOutfit(id);
                          else onRemoveSavedOutfit?.(id);
                        });
                      } else {
                        toDelete.forEach(id => onToggleOutfitBoard(id, activeOutfitFilter));
                      }
                      setOrganizedList(prev => prev.filter(o => !toDelete.has(o.id)));
                      setSelectedOutfitIds(new Set());
                      setShowDeleteOrganizeConfirm(false);
                    }}
                    className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
                  >{activeOutfitFilter === 'All' ? 'Delete' : 'Remove'}</button>
                  <button
                    onClick={() => setShowDeleteOrganizeConfirm(false)}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add to board overlay */}
      {addToBoardMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Add to {activeOutfitFilter}</h2>
            <button
              onClick={exitAddToBoard}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {savedOutfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Wand2 size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No published outfits yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {savedOutfits.map(outfit => {
                  const alreadyInBoard = (outfit.boards ?? []).includes(activeOutfitFilter);
                  const isSelected = addToBoardSelectedIds.has(outfit.id);
                  const { items: oItems = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
                  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
                  return (
                    <div
                      key={outfit.id}
                      onClick={alreadyInBoard ? undefined : () => toggleAddBoardOutfit(outfit.id)}
                      style={{ aspectRatio: '210 / 297', ...bgStyle }}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-150 select-none ${
                        alreadyInBoard ? 'cursor-default' : 'cursor-pointer'
                      } ${isSelected && !alreadyInBoard ? 'ring-[3px] ring-gray-900' : ''} ${
                        alreadyInBoard ? 'ring-[3px] ring-emerald-400' : ''
                      }`}
                    >
                      {outfit.thumbnail ? (
                        <img src={outfit.thumbnail} alt={outfit.name || 'Outfit'} className="w-full h-full object-cover pointer-events-none" />
                      ) : oItems.map((item, idx) => {
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
                              zIndex: item.zIndex ?? idx + 1,
                            }}
                          >
                            <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                          </div>
                        );
                      })}
                      {isSelected && !alreadyInBoard && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
                      {alreadyInBoard && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                          <Check size={20} strokeWidth={2.5} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {addToBoardSelectedIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{addToBoardSelectedIds.size} selected</span>
              )}
              <button
                onClick={confirmAddToBoard}
                disabled={addToBoardSelectedIds.size === 0}
                className={`h-12 px-5 rounded-2xl flex items-center gap-2 font-medium text-sm transition-colors ${
                  addToBoardSelectedIds.size > 0
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                Add to board
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateOutfitModal
          initialItem={createSeed}
          initialCanvasItems={initialCanvasItems}
          initialBgColor={initialBgColor}
          initialDesignWidth={initialDesignWidth}
          initialDesignHeight={initialDesignHeight}
          onClose={() => { setShowCreate(false); setCreateSeed(null); setInitialCanvasItems(null); setInitialBgColor(null); setInitialDesignWidth(null); setInitialDesignHeight(null); setEditingCollage(null); }}
          onPublish={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
            } else {
              if (editingCollage?.type === 'drafts') onRemoveDraftOutfit(editingCollage.id);
              onSaveOutfit(collage);
            }
          }}
          onAutoSave={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
            } else if (editingCollage?.type === 'drafts') {
              onUpdateDraftOutfit(editingCollage.id, collage);
            } else if (collage.items.length > 0) {
              onSaveDraftOutfit(collage);
            }
          }}
          onDelete={() => {
            if (editingCollage?.type === 'saved') onRemoveSavedOutfit?.(editingCollage.id);
            else if (editingCollage?.type === 'drafts') onRemoveDraftOutfit(editingCollage.id);
          }}
          onDetachCollage={() => setEditingCollage(null)}
          items={items}
          boards={boards}
        />
      )}

      {newBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNewBoardOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Board</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Name <span className="text-red-400">*</span></label>
                <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name" autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span></label>
                <textarea value={newBoardDesc} onChange={e => setNewBoardDesc(e.target.value)} maxLength={150} rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={!newBoardName.trim() || (outfitBoards ?? []).includes(newBoardName.trim())}
                onClick={() => {
                  const n = newBoardName.trim();
                  onCreateOutfitBoard(n, newBoardDesc.trim());
                  if (pendingOrganizeAdd) {
                    organizedList.forEach(outfit => {
                      if (pendingOrganizeAdd.has(outfit.id)) onToggleOutfitBoard(outfit.id, n);
                    });
                    setPendingOrganizeAdd(null);
                  }
                  setActiveOutfitFilter(n);
                  setNewBoardOpen(false);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >Create</button>
              <button onClick={() => { setPendingOrganizeAdd(null); setNewBoardOpen(false); }} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Board</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Name <span className="text-red-400">*</span></label>
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={20} autoFocus
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span></label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={150} rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={!editName.trim()}
                onClick={() => { const n = editName.trim(); onEditOutfitBoard(editBoard, n, editDesc.trim()); if (activeOutfitFilter === editBoard) setActiveOutfitFilter(n); setEditBoard(null); }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >Save</button>
              <button onClick={() => setEditBoard(null)} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete "{deleteConfirmBoard}"?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">This board will be permanently removed. Outfits inside won't be deleted.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onDeleteOutfitBoard(deleteConfirmBoard); if (activeOutfitFilter === deleteConfirmBoard) setActiveOutfitFilter('All'); setDeleteConfirmBoard(null); }}
                className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
              >Delete Board</button>
              <button onClick={() => setDeleteConfirmBoard(null)} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
