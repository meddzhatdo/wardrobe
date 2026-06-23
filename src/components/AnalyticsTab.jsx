import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { CATEGORIES } from '../lib/constants.js';

export function AnalyticsTab({ items = [], wearLogs = [], onSelectItem, onUpdateItem, currencySymbol = '$', isPreview = false, onSignIn }) {
  const [cpwSort,        setCpwSort]        = useState('highest-cpw');
  const [cpwCategory,    setCpwCategory]    = useState('All');
  const [cpwCatOpen,     setCpwCatOpen]     = useState(false);
  const cpwCatRef = useRef(null);
  useEffect(() => {
    if (!cpwCatOpen) return;
    const h = e => { if (!cpwCatRef.current?.contains(e.target)) setCpwCatOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cpwCatOpen]);
  const [mostWornPeriod, setMostWornPeriod] = useState('90d');
  const [mostWornIndex,  setMostWornIndex]  = useState(0);
  const [editingCostId,  setEditingCostId]  = useState(null);
  const [editingCostVal, setEditingCostVal] = useState('');
  const today   = new Date().toISOString().split('T')[0];
  const cutoff90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  const itemMap = Object.fromEntries(items.map(i => [String(i.id), i]));

  // Per-item wear counts — capped at 1 per item per calendar day
  const wearCounts90  = {};
  const wearCountsAll = {};
  const dateItemSets  = {};
  for (const log of wearLogs) {
    if (!dateItemSets[log.worn_date]) dateItemSets[log.worn_date] = new Set();
    for (const id of (log.item_ids ?? [])) {
      if (!dateItemSets[log.worn_date].has(id)) {
        dateItemSets[log.worn_date].add(id);
        wearCountsAll[id] = (wearCountsAll[id] ?? 0) + 1;
        if (log.worn_date >= cutoff90) wearCounts90[id] = (wearCounts90[id] ?? 0) + 1;
      }
    }
  }
  const wearCounts = mostWornPeriod === '90d' ? wearCounts90 : wearCountsAll;

  const everWornIds = new Set(wearLogs.flatMap(l => l.item_ids ?? []));

  const topItems = Object.entries(wearCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ item: itemMap[id], count }))
    .filter(({ item }) => !!item);

  const neverWorn = items.filter(i => !everWornIds.has(String(i.id)));

  const parsePrice = p => { const n = parseFloat(String(p ?? '').replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };

  const cpwRows = items.map(item => {
    const cost  = parsePrice(item.price);
    const wears = wearCounts[String(item.id)] ?? 0;
    const cpw   = cost != null ? (wears > 0 ? cost / wears : cost) : null;
    return { item, cost, wears, cpw };
  });

  const sortCpw = arr => [...arr].sort((a, b) => {
    if (cpwSort === 'most-worn') return b.wears - a.wears || (a.item.name || '').localeCompare(b.item.name || '');
    if (cpwSort === 'alpha')     return (a.item.name || '').localeCompare(b.item.name || '');
    // price-based sorts: items with no price always go to the bottom
    if (a.cost == null && b.cost == null) return (a.item.name || '').localeCompare(b.item.name || '');
    if (a.cost == null) return 1;
    if (b.cost == null) return -1;
    if (cpwSort === 'lowest-cpw')   return (a.cpw ?? 0) - (b.cpw ?? 0);
    if (cpwSort === 'highest-cost') return (b.cost ?? 0) - (a.cost ?? 0);
    return (b.cpw ?? 0) - (a.cpw ?? 0); // highest-cpw (default)
  });

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thisWeekDays  = new Set(wearLogs.filter(l => l.worn_date >= weekAgo).map(l => l.worn_date)).size;
  const totalItemWears = Object.values(
    wearLogs.reduce((acc, l) => {
      if (!acc[l.worn_date]) acc[l.worn_date] = new Set();
      (l.item_ids ?? []).forEach(id => acc[l.worn_date].add(id));
      return acc;
    }, {})
  ).reduce((s, set) => s + set.size, 0);

  if (wearLogs.length === 0 && !isPreview) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-28 md:pb-8">
        <div className="px-6 md:px-8 pt-8 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your style habits over time</p>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BarChart2 size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">No wear data yet</p>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">
            Use "I Wore This" on the Today tab or on any saved outfit in Studio to start tracking your style habits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-28 md:pb-8">
      <div className="px-6 md:px-8 pt-8 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your style habits</p>
      </div>

      {isPreview && (
        <div className="mx-6 md:mx-8 mb-6 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <BarChart2 size={16} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500 flex-1 leading-snug">
            You're viewing <span className="font-semibold text-gray-700">sample data</span>.{' '}
            <button onClick={onSignIn} className="font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors">Sign in</button>
            {' '}to track your real wardrobe.
          </p>
        </div>
      )}

      <div className="px-6 md:px-8 flex flex-col gap-8">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: thisWeekDays,    label: 'days logged\nthis week' },
            { value: wearLogs.length, label: 'total outfit\nlogs' },
            { value: totalItemWears,  label: 'total item\nwears' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-4">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Most worn items — carousel */}
        {topItems.length > 0 && (() => {
          const idx = Math.min(mostWornIndex, topItems.length - 1);
          const { item, count } = topItems[idx];
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em]">Most Worn</p>
                <div className="flex gap-1 bg-gray-100 rounded-full p-0.5">
                  {[{ v: '90d', label: '90 Days' }, { v: 'all', label: 'All Time' }].map(({ v, label }) => (
                    <button key={v} onClick={() => { setMostWornPeriod(v); setMostWornIndex(0); }}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${mostWornPeriod === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMostWornIndex(i => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-25 transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-center truncate max-w-[180px]">{item.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-400">Times worn: {count}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {topItems.map((_, i) => (
                      <button key={i} onClick={() => setMostWornIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'}`} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setMostWornIndex(i => Math.min(topItems.length - 1, i + 1))}
                  disabled={idx === topItems.length - 1}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-25 transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Cost per wear */}
        {cpwRows.length > 0 && (() => {
          const fmtCost = n => n != null ? `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—';
          const fmtCpw  = n => n != null ? `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

          const CpwRow = ({ item, cost, wears, cpw }) => {
            const handleCostSave = () => {
              const raw = editingCostVal.trim().replace(/[^0-9.]/g, '');
              const num = parseFloat(raw);
              if (!isNaN(num)) onUpdateItem?.(item.id, { price: String(num) });
              setEditingCostId(null);
            };
            return (
              <div className="flex items-center py-2.5 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />}
                </div>
                <div className="flex-1 min-w-0 pl-3">
                  {item.brand && item.brand !== '—' && <p className="text-[11px] text-gray-400 truncate leading-tight">{item.brand}</p>}
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name || 'Unnamed'}</p>
                </div>
                <span className="text-sm text-gray-500 flex-shrink-0 w-10 text-right pl-5">{wears}</span>
                {!isPreview && editingCostId === item.id ? (
                  <input
                    autoFocus
                    className="flex-shrink-0 w-16 text-sm text-right pl-5 bg-transparent focus:outline-none focus:bg-gray-50 focus:rounded"
                    value={editingCostVal}
                    onChange={e => setEditingCostVal(e.target.value)}
                    onBlur={handleCostSave}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingCostId(null); }}
                  />
                ) : isPreview ? (
                  <span className="flex-shrink-0 w-16 text-sm text-gray-500 text-right pl-5">
                    {fmtCost(cost)}
                  </span>
                ) : (
                  <button
                    onClick={() => { setEditingCostId(item.id); setEditingCostVal(String(cost ?? '')); }}
                    title="Click to edit cost"
                    className="flex-shrink-0 w-16 text-sm text-gray-500 text-right pl-5 hover:text-gray-900 hover:underline transition-colors"
                  >
                    {fmtCost(cost)}
                  </button>
                )}
                <span className={`text-sm font-semibold flex-shrink-0 w-24 text-right pl-5 ${cpw != null && cost != null && cpw < cost ? 'text-green-600' : 'text-gray-800'}`}>
                  {fmtCpw(cpw)}
                </span>
              </div>
            );
          };

          const sortOptions = [
            { value: 'highest-cpw',  label: 'Highest $/wear' },
            { value: 'lowest-cpw',   label: 'Lowest $/wear'  },
            { value: 'most-worn',    label: 'Most worn'      },
            { value: 'highest-cost', label: 'Highest cost'   },
            { value: 'alpha',        label: 'A → Z'          },
          ];

          const availableCats = CATEGORIES;
          const filteredCpwRows = cpwCategory === 'All' ? cpwRows : cpwRows.filter(r => (r.item.category || 'Other') === cpwCategory);

          return (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em]">Cost per Wear</p>
                <div className="relative flex-shrink-0" ref={cpwCatRef}>
                  <button
                    onClick={() => setCpwCatOpen(o => !o)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      cpwCategory !== 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cpwCategory === 'All' ? 'Category' : cpwCategory}
                    <ChevronDown size={11} className={`transition-transform ${cpwCatOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {cpwCatOpen && (
                    <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-20 max-h-56 overflow-y-auto scrollbar-hide">
                      {['All', ...availableCats].map(cat => (
                        <button key={cat} onClick={() => { setCpwCategory(cat); setCpwCatOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                          <span className={`text-sm ${cat === cpwCategory ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {cat === 'All' ? 'All categories' : cat}
                          </span>
                          {cat === cpwCategory && <Check size={14} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sort pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3">
                {sortOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setCpwSort(o.value)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      cpwSort === o.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Column headers */}
              <div className="flex items-center pb-1.5 border-b border-gray-200">
                <div className="w-10 flex-shrink-0" />
                <p className="flex-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide pl-3">Item</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-10 text-right pl-5">Worn</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-16 text-right pl-5">Cost</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-24 text-right pl-5">Per wear</p>
              </div>

              {/* Rows */}
              {sortCpw(filteredCpwRows).map(row => <CpwRow key={row.item.id} {...row} />)}
            </div>
          );
        })()}

        {/* Never worn */}
        {neverWorn.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-3">
              Never Worn · {neverWorn.length} {neverWorn.length === 1 ? 'item' : 'items'}
            </p>
            <div className="grid gap-3 pb-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
              {neverWorn.map(item => (
                <button key={item.id} onClick={() => onSelectItem?.(item)} className="flex flex-col items-center gap-1 text-left">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center leading-tight w-full truncate">{item.name || item.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
