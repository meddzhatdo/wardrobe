import React, { useState, useRef } from 'react';
import {
  Loader2, X, Plus, Search, Shirt, Brush,
  Heart, SlidersHorizontal, Check, Layers, Trash2,
} from 'lucide-react';
import { CATEGORIES } from '../lib/constants.js';

function GridCard({ item, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div className="cursor-pointer group" onClick={() => onClick(item)}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <div className="w-full aspect-[3/4] p-5 relative">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.04] ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${item._bgRemoving ? 'blur-sm' : ''}`}
          />
          {item._bgRemoving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                <Loader2 size={11} className="animate-spin text-gray-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Processing…</span>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/6 transition-colors duration-300 pointer-events-none" />
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-gray-800 truncate leading-snug">{item.name}</p>
      </div>
    </div>
  );
}

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
      <div className="w-full aspect-square p-3">
        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain pointer-events-none" />
      </div>
      {selected && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
    </div>
  );
}

export function WardrobeTab({ items, boards, boardMeta, likedItems, onSelectItem, onDeleteBoard, onEditBoard, onDeleteItems, onCreateBoard, onToggleItemBoard, onAddItem, userId, isPreview = false }) {
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
  const [organizeBoardPickerOpen, setOrganizeBoardPickerOpen] = useState(false);
  const [pendingOrganizeAddItems, setPendingOrganizeAddItems] = useState(null);
  const organizeBoardPickerRef = useRef(null);
  const [addToBoardMode, setAddToBoardMode] = useState(false);
  const [addToBoardSelectedIds, setAddToBoardSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  React.useEffect(() => {
    if (!addMenuOpen) return;
    const handler = e => {
      if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  React.useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => {
      if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  React.useEffect(() => {
    if (!organizeBoardPickerOpen) return;
    const handler = e => { if (!organizeBoardPickerRef.current?.contains(e.target)) setOrganizeBoardPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [organizeBoardPickerOpen]);

  React.useEffect(() => {
    if (!filterOpen) return;
    const handler = e => { if (!filterDropdownRef.current?.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  React.useEffect(() => {
    setOrganizeMode(false);
    setSelectedItemIds(new Set());
    setOrganizedItems([]);
  }, [activeFilter, favoritesOnly]);

  const filtered = (() => {
    let list = activeFilter === 'All' ? items : items.filter(i => i.boards.includes(activeFilter));
    if (favoritesOnly) list = list.filter(i => likedItems.has(i.id));
    try {
      const key = `wardrobe-order-${userId || 'guest'}-${activeFilter}-${favoritesOnly ? 'fav' : 'all'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const ids = JSON.parse(saved);
        const idSet = new Set(ids);
        const idMap = new Map(list.map(i => [i.id, i]));
        const ordered = ids.flatMap(id => idMap.has(id) ? [idMap.get(id)] : []);
        const newItems = list.filter(i => !idSet.has(i.id));
        list = [...newItems, ...ordered];
      }
    } catch {}
    return list;
  })();

  const availableCategories = CATEGORIES;

  const displayItems = (() => {
    let list = filtered;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q) ||
        (i.color || '').toLowerCase().includes(q) ||
        (i.material || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter.size > 0) {
      list = list.filter(i => categoryFilter.has(i.category));
    }
    return list;
  })();

  const enterOrganize = () => {
    setOrganizedItems([...filtered]);
    setSelectedItemIds(new Set());
    setOrganizeMode(true);
  };

  const exitOrganize = () => {
    try {
      const key = `wardrobe-order-${userId || 'guest'}-${activeFilter}-${favoritesOnly ? 'fav' : 'all'}`;
      localStorage.setItem(key, JSON.stringify(organizedItems.map(i => i.id)));
    } catch {}
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

  const enterAddToBoard = () => {
    setAddToBoardSelectedIds(new Set());
    setAddToBoardMode(true);
  };

  const exitAddToBoard = () => {
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const confirmAddToBoard = () => {
    addToBoardSelectedIds.forEach(id => onToggleItemBoard(id, activeFilter));
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const toggleAddBoardItem = id => {
    setAddToBoardSelectedIds(prev => {
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
        {/* Row 1: page title + add/search */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Wardrobe</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (searchOpen) {
                  setSearchOpen(false);
                  setSearchQuery('');
                } else {
                  setSearchOpen(true);
                }
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                searchOpen ? 'bg-gray-900 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {searchOpen
                ? <X size={16} strokeWidth={2.5} className="text-white" />
                : <Search size={16} strokeWidth={2} className="text-gray-600" />}
            </button>
            {!isPreview && (
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
            )}
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="mb-4 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
            <Search size={14} strokeWidth={2} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, category, color…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Row 2: board title + organize/settings */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-3xl font-semibold text-gray-900 truncate max-w-[20ch]">{activeFilter}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeFilter !== 'All' && (
              <div className="relative" ref={boardMenuRef}>
                <button
                  onClick={() => setBoardMenuOpen(o => o ? null : activeFilter)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xl leading-none"
                >
                  ···
                </button>
                {boardMenuOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-20">
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
                      onClick={() => { setBoardMenuOpen(null); enterAddToBoard(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Add to board
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
            <button
              onClick={organizeMode ? exitOrganize : enterOrganize}
              className={`flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors text-sm font-medium ${
                organizeMode ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {organizeMode ? <X size={14} strokeWidth={2.5} /> : <Brush size={14} strokeWidth={2} />}
              {organizeMode ? 'Done' : 'Organize'}
            </button>
          </div>
        </div>
        <div className="mb-5">
          <p className="text-sm text-gray-400 mt-0.5">{displayItems.length} item{displayItems.length !== 1 ? 's' : ''}{searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}</p>
          <div className="min-h-[1.25rem] mt-0.5">
            {activeFilter !== 'All' && boardMeta[activeFilter]?.description && (
              <p className="text-sm text-gray-400 italic pl-3">{boardMeta[activeFilter].description}</p>
            )}
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

        {/* ── Favorites + Filter ── */}
        <div className="pb-3 flex items-center gap-2">
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

          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter.size > 0
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter{categoryFilter.size > 0 ? ` · ${categoryFilter.size}` : ''}
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56 z-20 max-h-40 overflow-y-auto scrollbar-hide">
                {availableCategories.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No categories found</p>
                ) : (
                  availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(prev => {
                        const next = new Set(prev);
                        next.has(cat) ? next.delete(cat) : next.add(cat);
                        return next;
                      })}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className={categoryFilter.has(cat) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{cat}</span>
                      {categoryFilter.has(cat) && <Check size={14} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                    </button>
                  ))
                )}
                {categoryFilter.size > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setCategoryFilter(new Set()); setFilterOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              {searchQuery.trim()
                ? <Search size={22} className="text-gray-300" />
                : <Shirt size={22} className="text-gray-300" />}
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {searchQuery.trim() ? 'No items match your search' : 'No items in this board'}
            </p>
          </div>
        ) : (
          <div className="wardrobe-item-grid">
            {displayItems.map(item => (
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
              onClick={() => {
                const allSelected = selectedItemIds.size > 0;
                setSelectedItemIds(allSelected ? new Set() : new Set(organizedItems.map(i => i.id)));
              }}
              className="absolute left-5 md:left-7 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {selectedItemIds.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
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
              <div className="wardrobe-item-grid">
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

          {/* Floating action bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none z-10">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {selectedItemIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{selectedItemIds.size} selected</span>
              )}
              {/* Move to board */}
              <div className="relative" ref={organizeBoardPickerRef}>
                <div className="relative group">
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                    selectedItemIds.size > 0 && !organizeBoardPickerOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                  }`}>
                    <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Move to board</span>
                  </div>
                  <button
                    disabled={selectedItemIds.size === 0}
                    onClick={() => setOrganizeBoardPickerOpen(o => !o)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      selectedItemIds.size > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Layers size={18} />
                  </button>
                </div>
                {organizeBoardPickerOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-10">
                    {boards.filter(b => b !== 'All').length === 0 && (
                      <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                    )}
                    {boards.filter(b => b !== 'All').map(board => {
                      const selectedArr = organizedItems.filter(i => selectedItemIds.has(i.id));
                      const allInBoard = selectedArr.length > 0 && selectedArr.every(i => (i.boards ?? []).includes(board));
                      return (
                        <button
                          key={board}
                          onClick={() => {
                            const toAdd = organizedItems.filter(item =>
                              selectedItemIds.has(item.id) && !(item.boards ?? []).includes(board)
                            );
                            toAdd.forEach(item => onToggleItemBoard(item.id, board));
                            if (toAdd.length > 0) {
                              setOrganizedItems(prev => prev.map(item =>
                                toAdd.some(t => t.id === item.id)
                                  ? { ...item, boards: [...(item.boards ?? []), board] }
                                  : item
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
                            setPendingOrganizeAddItems(new Set(selectedItemIds));
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
              {/* Delete */}
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

      {/* ── Add to board full-screen overlay ── */}
      {addToBoardMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Add to {activeFilter}</h2>
            <button
              onClick={exitAddToBoard}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* All items grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Shirt size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No items in your wardrobe</p>
              </div>
            ) : (
              <div className="wardrobe-item-grid">
                {items.map(item => {
                  const alreadyInBoard = (item.boards ?? []).includes(activeFilter);
                  const isSelected = addToBoardSelectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={alreadyInBoard ? undefined : () => toggleAddBoardItem(item.id)}
                      className={`relative rounded-2xl overflow-hidden bg-gray-100 transition-all duration-150 select-none ${
                        alreadyInBoard ? 'cursor-default' : 'cursor-pointer'
                      } ${isSelected && !alreadyInBoard ? 'ring-[3px] ring-gray-900' : ''} ${
                        alreadyInBoard ? 'ring-[3px] ring-emerald-400' : ''
                      }`}
                    >
                      <div className="w-full aspect-square p-3">
                        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain pointer-events-none" />
                      </div>
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

          {/* Floating action bar */}
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
                  if (pendingOrganizeAddItems) {
                    organizedItems.forEach(item => {
                      if (pendingOrganizeAddItems.has(item.id)) onToggleItemBoard(item.id, name);
                    });
                    setPendingOrganizeAddItems(null);
                  }
                  setActiveFilter(name);
                  setNewBoardOpen(false);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => { setPendingOrganizeAddItems(null); setNewBoardOpen(false); }}
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
