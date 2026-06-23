import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, ChevronDown, Check, Cloud, Sun, CloudSun, CloudFog,
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
  X, Heart, SlidersHorizontal, Shirt, Sparkles,
  Bookmark, Pencil, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { DEFAULT_CITY, DEFAULT_LAT, DEFAULT_LON, wmoCondition, CONDITION_LABEL_META } from '../lib/weather.js';
import {
  buildWeatherPool, DESIGN_W, DESIGN_H, COLLAGE_HEADER_OFFSET,
  aiOutfitToCanvasItems, FadeIn, GeneratingSkeleton, OutfitCollage,
  OUTFITS_CACHE_KEY, todayDateKey, loadCachedOutfits, saveCachedOutfits, weatherFingerprint, useCollageScale,
} from '../lib/collage.jsx';
import { CATEGORIES, PRESET_LOCATIONS } from '../lib/constants.js';
import { supabase } from '../supabase.js';

async function callAnthropicForOutfits(weather, allItems, userProfile = {}) {
  const pool = buildWeatherPool(weather, allItems);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch('/api/generate-outfits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ weather, items: pool, userProfile }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const parsed = await res.json();
  if (!Array.isArray(parsed)) throw new Error('Response was not a JSON array');

  const itemMap = Object.fromEntries(allItems.map(i => [i.id, i]));
  const valid = parsed.filter(outfit => {
    const missingIds = (outfit.itemIds ?? []).filter(id => !itemMap[id]);
    if (missingIds.length > 0) console.warn(`Outfit "${outfit.outfitName}" references unknown item IDs:`, missingIds);
    const cats = (outfit.itemIds ?? []).map(id => itemMap[id]?.category).filter(Boolean);
    const hasOnePiece = cats.includes('Dresses & Jumpsuits');
    const hasTop      = cats.some(c => c === 'Tops' || c === 'Knitwear & Sweaters');
    const bottomCount = cats.filter(c => c === 'Bottoms').length;
    const hasShoes    = cats.includes('Shoes');
    if (!hasOnePiece && !hasTop)             return false;
    if (bottomCount > 1)                     return false;
    if (!hasOnePiece && bottomCount === 0)   return false;
    if (!hasShoes)                           return false;
    return true;
  });

  if (valid.length === 0) throw new Error('No valid outfits could be generated with your current wardrobe items.');
  return valid;
}

function WeatherWidget({ lat, lon, city, onCommit, onSelectLocation, onWeatherReady, compact = false }) {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [isEditing,      setIsEditing]      = useState(false);
  const [inputValue,     setInputValue]     = useState('');
  const [suggestions,    setSuggestions]    = useState([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null) { setLoading(true); return; }
    setLoading(true);
    setData(null);
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=2`,
      { signal: ctrl.signal }
    )
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); onWeatherReady?.(d); })
      .catch(e => { if (e.name !== 'AbortError') setLoading(false); });
    return () => ctrl.abort();
  }, [lat, lon]);

  const startEditing = () => {
    setInputValue(city ?? '');
    setSuggestions([]);
    setHighlightedIdx(-1);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const clearSearch = () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setHighlightedIdx(-1);
  };

  const commit = () => {
    clearSearch();
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== city) onCommit(trimmed);
    setIsEditing(false);
  };

  const selectSuggestion = (result) => {
    clearSearch();
    const addr = result.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
    const region = addr.state_code || addr.state || '';
    const displayCity = region ? `${name}, ${region}` : name;
    onSelectLocation({ city: displayCity, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
    setIsEditing(false);
  };

  const onInputChange = (val) => {
    setInputValue(val);
    setHighlightedIdx(-1);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.trim())}&format=json&addressdetails=1&limit=5`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(await res.json());
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      }
    }, 320);
  };

  const onKeyDown = e => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Enter' && highlightedIdx >= 0) {
        selectSuggestion(suggestions[highlightedIdx]);
        return;
      }
    }
    if (e.key === 'Enter')  { commit(); return; }
    if (e.key === 'Escape') { clearSearch(); setIsEditing(false); }
  };

  const skeletonBg = 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)';

  if (loading || !data) {
    if (compact) {
      return (
        <div className="flex-shrink-0 rounded-2xl overflow-hidden animate-pulse" style={{ width: 148, background: skeletonBg }}>
          <div className="p-3 space-y-2">
            <div className="h-2.5 w-16 bg-white/20 rounded-full" />
            <div className="h-10 w-20 bg-white/20 rounded-xl" />
            <div className="h-2.5 w-14 bg-white/20 rounded-full" />
            <div className="h-2.5 w-12 bg-white/20 rounded-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: skeletonBg }}>
        <div className="px-6 pt-5 pb-5 animate-pulse">
          <div className="h-3 w-24 bg-white/20 rounded-full mb-4" />
          <div className="flex items-center justify-between">
            <div className="h-[72px] w-28 bg-white/20 rounded-2xl" />
            <div className="space-y-3 text-right">
              <div className="h-5 w-32 bg-white/20 rounded-full ml-auto" />
              <div className="h-4 w-24 bg-white/20 rounded-full ml-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currTemp = Math.round(data.current.temperature_2m);
  const currCode = data.current.weather_code;
  const high     = Math.round(data.daily.temperature_2m_max[0]);
  const low      = Math.round(data.daily.temperature_2m_min[0]);
  const { label, Icon: CondIcon, bg } = wmoCondition(currCode);

  const nowMs = Date.now();
  const hours = [];
  for (let i = 0; i < data.hourly.time.length; i++) {
    const ms = new Date(data.hourly.time[i]).getTime();
    if (ms >= nowMs - 30 * 60 * 1000) {
      hours.push({
        key:  data.hourly.time[i],
        ms,
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weather_code[i],
      });
      if (hours.length >= 24) break;
    }
  }

  if (compact) {
    return (
      <div className="relative flex-shrink-0" style={{ width: 148 }}>
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: bg }}>
          <div className="p-3">
            {/* Location */}
            {onCommit && isEditing ? (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={commit}
                  placeholder="City…"
                  className="bg-transparent text-[11px] font-medium text-white border-b border-white/40 focus:border-white/80 focus:outline-none w-full placeholder:text-white/40"
                />
              </div>
            ) : onCommit ? (
              <button onClick={startEditing} className="flex items-center gap-1 mb-2 w-full min-w-0">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <span className="text-[11px] font-medium text-white/80 truncate">{city ?? DEFAULT_CITY}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <span className="text-[11px] font-medium text-white/80 truncate">{city ?? DEFAULT_CITY}</span>
              </div>
            )}
            {/* Temp */}
            <div className="flex items-start gap-1">
              <span className="text-[42px] font-thin text-white leading-none tracking-tight">{currTemp}</span>
              <span className="text-sm font-light text-white/60 mt-1.5">°F</span>
            </div>
            {/* Condition */}
            <div className="flex items-center gap-1.5 mt-2">
              <CondIcon size={13} className="text-white/90" strokeWidth={1.8} />
              <span className="text-[11px] font-medium text-white/80">{label}</span>
            </div>
            {/* H/L */}
            <p className="text-[10px] text-white/50 mt-1 tracking-wide">H: {high}°  ·  L: {low}°</p>
          </div>
        </div>
        {/* Autocomplete suggestions */}
        {isEditing && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
            {suggestions.map((s, i) => {
              const addr = s.address || {};
              const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
              const region = addr.state_code || addr.state || '';
              const display = region ? `${name}, ${region}` : name;
              return (
                <button
                  key={s.place_id ?? i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                    highlightedIdx === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate font-medium text-gray-800">{display}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="rounded-3xl overflow-hidden" style={{ background: bg }}>
        {/* Location row */}
        <div className="px-6 pt-5">
          <div className="relative flex items-center h-5">
            <div
              className="loc-pill absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 0 : 280, opacity: isEditing ? 0 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}
            >
              {onCommit ? (
                <button onClick={startEditing} className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin size={12} className="text-white/60 flex-shrink-0" />
                  <span className="text-sm font-medium text-white/80 tracking-wide">{city ?? DEFAULT_CITY}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin size={12} className="text-white/60 flex-shrink-0" />
                  <span className="text-sm font-medium text-white/80 tracking-wide">{city ?? DEFAULT_CITY}</span>
                </div>
              )}
            </div>
            <div
              className="loc-input absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 280 : 0, opacity: isEditing ? 1 : 0, pointerEvents: isEditing ? 'auto' : 'none' }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <MapPin size={12} className="text-white/60 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={commit}
                  placeholder="Search city…"
                  className="bg-transparent text-sm font-medium text-white border-b border-white/40 focus:border-white/80 focus:outline-none w-48 placeholder:text-white/40 transition-colors"
                />
              </div>
            </div>
            <div className="invisible flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
              <MapPin size={12} className="mr-1" />{city ?? DEFAULT_CITY}
            </div>
          </div>
        </div>

        {/* Current conditions */}
        <div className="px-6 pt-3 pb-5 flex items-center justify-between">
          <div className="flex items-start">
            <span className="text-[68px] font-thin text-white leading-none tracking-tight">{currTemp}</span>
            <span className="text-xl font-light text-white/60 mt-3 ml-0.5">°F</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <CondIcon size={20} className="text-white/90" strokeWidth={1.8} />
              <span className="text-[17px] font-medium text-white">{label}</span>
            </div>
            <p className="text-sm text-white/60 font-medium tracking-wide">H: {high}°  ·  L: {low}°</p>
          </div>
        </div>

      </div>

      {/* Autocomplete suggestions */}
      {isEditing && suggestions.length > 0 && (
        <div className="absolute top-[44px] left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          {suggestions.map((s, i) => {
            const addr = s.address || {};
            const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
            const region = addr.state_code || addr.state || '';
            const country = addr.country || '';
            const display = region ? `${name}, ${region}` : name;
            return (
              <button
                key={s.place_id ?? i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                  highlightedIdx === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{display}</p>
                  {country && <p className="text-xs text-gray-400 truncate">{country}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LocationBar({ city, onCommit, onSelectLocation }) {
  const [editing,  setEditing]  = useState(false);
  const [val,      setVal]      = useState('');
  const [suggs,    setSuggs]    = useState([]);
  const [hi,       setHi]       = useState(-1);
  const inputRef    = useRef(null);
  const containerRef = useRef(null);
  const debRef      = useRef(null);
  const ctrlRef     = useRef(null);

  const clearSearch = () => {
    clearTimeout(debRef.current);
    ctrlRef.current?.abort();
    setSuggs([]);
    setHi(-1);
  };
  const commit = () => {
    clearSearch();
    const t = val.trim();
    if (t && t !== city) onCommit(t);
    setEditing(false);
  };
  const startEdit = () => {
    setVal(city ?? '');
    setSuggs([]);
    setHi(-1);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };
  const pick = s => {
    clearSearch();
    const addr = s.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
    const region = addr.state_code || addr.state || '';
    onSelectLocation({ city: region ? `${name}, ${region}` : name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
    setEditing(false);
  };
  const onChange = v => {
    setVal(v);
    setHi(-1);
    clearTimeout(debRef.current);
    ctrlRef.current?.abort();
    if (v.trim().length < 2) { setSuggs([]); return; }
    debRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v.trim())}&format=json&addressdetails=1&limit=5`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        );
        setSuggs(await res.json());
      } catch (e) { if (e.name !== 'AbortError') setSuggs([]); }
    }, 320);
  };
  const onKeyDown = e => {
    if (suggs.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, suggs.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); return; }
      if (e.key === 'Enter' && hi >= 0) { pick(suggs[hi]); return; }
    }
    if (e.key === 'Enter')  { commit(); return; }
    if (e.key === 'Escape') { clearSearch(); setEditing(false); }
  };
  const handleBlur = e => {
    if (containerRef.current?.contains(e.relatedTarget)) return;
    commit();
  };

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      {editing ? (
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={val}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={handleBlur}
            placeholder="Search city…"
            className="bg-transparent text-base text-gray-700 focus:outline-none w-56 placeholder:text-gray-400"
          />
        </div>
      ) : (
        <button onClick={startEdit} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5">
          <MapPin size={15} className="text-gray-500 flex-shrink-0" />
          <span className="text-base text-gray-600 max-w-[220px] truncate">{city ?? 'Set location'}</span>
        </button>
      )}
      {editing && suggs.length > 0 && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-72">
          {suggs.map((s, i) => {
            const addr = s.address || {};
            const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
            const region = addr.state_code || addr.state || '';
            const country = addr.country || '';
            const display = region ? `${name}, ${region}` : name;
            return (
              <button key={s.place_id ?? i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(s)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${hi === i ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{display}</p>
                  {country && <p className="text-xs text-gray-400 truncate">{country}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PREVIEW_CITY_OUTFITS = {
  'New York, NY': [
    { outfitName: 'Winter Polish',    description: 'Cashmere warmth meets tailored structure for a cold overcast day.', itemIds: [21, 24, 40, 35, 1]  },
    { outfitName: 'Puff & Polish',    description: 'Max warmth with a sleek monochrome silhouette.',                    itemIds: [33, 18, 4,  12, 3]  },
    { outfitName: 'Warm Tones',       description: 'Rich burgundy and camel cut through a grey winter morning.',       itemIds: [34, 37, 40, 39, 38] },
  ],
  'Los Angeles, CA': [
    { outfitName: 'Sunny Edit',       description: 'Effortless warm-weather dressing for a clear LA day.',             itemIds: [11, 26, 27, 38, 22] },
    { outfitName: 'Boho Glam',        description: 'Flowy silk and a floral skirt — perfect for the sunshine.',        itemIds: [23, 7,  41, 1]      },
    { outfitName: 'Garden Party',     description: 'Polished and playful in the California sun.',                      itemIds: [31, 9,  30, 13]     },
  ],
  'Miami, FL': [
    { outfitName: 'Miami Afternoon',  description: 'Breezy crochet and wedges for a tropical afternoon.',              itemIds: [25, 41, 22, 38]     },
    { outfitName: 'Poolside Glam',    description: 'Draped silk and crystal heels — resort elegance.',                 itemIds: [36, 7,  30, 2]      },
    { outfitName: 'Rain-Ready',       description: 'Light and practical for when the afternoon showers arrive.',       itemIds: [19, 26, 4,  1]      },
  ],
  'Chicago, IL': [
    { outfitName: 'Blizzard Chic',    description: 'Staying warm and stylish when it snows.',                          itemIds: [21, 18, 4,  12, 3]  },
    { outfitName: 'Deep Freeze',      description: 'Sleek tonal layers built for the coldest days.',                   itemIds: [33, 24, 40, 35, 1]  },
    { outfitName: 'Scarlet Snow',     description: 'A pop of burgundy against a grey winter cityscape.',               itemIds: [34, 37, 4,  12, 38] },
  ],
  'Seattle, WA': [
    { outfitName: 'Northwest Classic',description: 'A timeless trench-and-boot rainy-day uniform.',                    itemIds: [19, 24, 4,  39, 1]  },
    { outfitName: 'Rainy Layers',     description: 'Cashmere and leather keep the drizzle at bay.',                    itemIds: [21, 37, 4,  20, 38] },
    { outfitName: 'Effortless Grey',  description: 'Understated and polished for a cool overcast morning.',            itemIds: [29, 10, 40, 39, 13] },
  ],
};

export function TodayTab({ items = [], likedItems = new Set(), onSaveToPublished, onEditInStudio, onLogWorn, wearLogs = [], isPreview = false, userId = null, userProfile = {}, boards = [] }) {
  const [location,       setLocation]       = useState({ city: null, lat: null, lon: null });
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [outfits,        setOutfits]        = useState([]);
  const [generating,     setGenerating]     = useState(false);
  const [genError,       setGenError]       = useState(null);
  const [currentIdx,     setCurrentIdx]     = useState(0);
  const [retryKey,       setRetryKey]       = useState(0);
  const [saveState,      setSaveState]      = useState('idle');
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [today, setToday] = useState(() => new Date().toISOString().split('T')[0]);
  const wornTodayKey  = userId ? `worn_today_${userId}_${today}` : null;

  const [wornItemIds,    setWornItemIds]    = useState(() => {
    if (!userId) return new Set();
    const key = `worn_today_${userId}_${new Date().toISOString().split('T')[0]}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  // Roll over at midnight without requiring a page reload
  useEffect(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - Date.now();
    const t = setTimeout(() => {
      const newDay = new Date().toISOString().split('T')[0];
      setToday(newDay);
      setWornItemIds(new Set());
    }, ms);
    return () => clearTimeout(t);
  }, [today]);
  const hasMountedRef  = useRef(false);
  const saveTimerRef   = useRef(null);
  const [pickerBoard,           setPickerBoard]           = useState('All');
  const [pickerSearch,          setPickerSearch]          = useState('');
  const [pickerFavoritesOnly,   setPickerFavoritesOnly]   = useState(false);
  const [pickerCategoryFilter,  setPickerCategoryFilter]  = useState(new Set());
  const [pickerFilterOpen,      setPickerFilterOpen]      = useState(false);
  const pickerFilterRef  = useRef(null);
  const locationMenuRef  = useRef(null);
  const wornSectionRef   = useRef(null);
  const collageScale     = useCollageScale();
  const directionRef     = useRef('right');

  const navigate = (toIdx) => {
    directionRef.current = toIdx >= currentIdx ? 'right' : 'left';
    setCurrentIdx(toIdx);
  };

  const locationKey = isPreview ? 'wardrobe_location_preview' : `wardrobe_location_user_${userId}`;

  useEffect(() => {
    if (isPreview) {
      try {
        const saved = localStorage.getItem(locationKey);
        if (saved) {
          const loc = JSON.parse(saved);
          const preset = PRESET_LOCATIONS.find(p => p.city === loc.city);
          if (preset) {
            setLocation(preset);
            setWeatherSummary(preset.weather);
            return;
          }
        }
      } catch {}
      setLocation(PRESET_LOCATIONS[0]);
      setWeatherSummary(PRESET_LOCATIONS[0].weather);
      return;
    }

    try {
      const saved = localStorage.getItem(locationKey);
      if (saved) { setLocation(JSON.parse(saved)); return; }
    } catch {}

    if (!navigator.geolocation) {
      setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const { address } = await res.json();
          const name = address.city || address.town || address.village || address.county || DEFAULT_CITY;
          const region = address.state_code || address.state || '';
          setLocation({ city: region ? `${name}, ${region}` : name, lat: latitude, lon: longitude });
        } catch {
          setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
        }
      },
      () => setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON }),
      { timeout: 8000 }
    );
  }, [isPreview, locationKey]);

  useEffect(() => {
    if (!isPreview || !location.city) return;
    const cityOutfits = PREVIEW_CITY_OUTFITS[location.city];
    if (cityOutfits) {
      setOutfits(cityOutfits);
      setGenError(null);
      setCurrentIdx(0);
    }
  }, [isPreview, location.city]);

  useEffect(() => {
    if (isPreview) return;
    if (!weatherSummary || items.length === 0 || !location.city) return;

    const fp = weatherFingerprint(weatherSummary);
    const cached = loadCachedOutfits(fp);
    if (cached) {
      const existingIds = new Set(items.map(i => String(i.id)));
      const goodOutfits = cached.filter(o => (o.itemIds ?? []).every(id => existingIds.has(String(id))));
      if (goodOutfits.length === cached.length) {
        setOutfits(cached);
        setGenError(null);
          return;
      }
      const needed = 3 - goodOutfits.length;
      if (goodOutfits.length > 0) setOutfits(goodOutfits);
      let cancelled = false;
      setCurrentIdx(0);
      setGenError(null);
      setGenerating(true);
      callAnthropicForOutfits(weatherSummary, items, userProfile)
        .then(fresh => {
          if (cancelled) return;
          const combined = [...goodOutfits, ...fresh.slice(0, needed)];
          setOutfits(combined);
          saveCachedOutfits(combined, fp);
            })
        .catch(e => { if (!cancelled) setGenError(e.message); })
        .finally(() => { if (!cancelled) setGenerating(false); });
      return () => { cancelled = true; };
    }
    let cancelled = false;
    setOutfits([]);
    setCurrentIdx(0);
    setGenError(null);
    setGenerating(true);
    callAnthropicForOutfits(weatherSummary, items, userProfile)
      .then(results => {
        if (!cancelled) {
          setOutfits(results);
          saveCachedOutfits(results, fp);
            }
      })
      .catch(e       => { if (!cancelled) setGenError(e.message); })
      .finally(()    => { if (!cancelled) setGenerating(false); });
    return () => { cancelled = true; };
  }, [weatherSummary, items.length, location.city, retryKey]);

  useEffect(() => {
    if (!locationMenuOpen) return;
    const handler = e => { if (!locationMenuRef.current?.contains(e.target)) setLocationMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locationMenuOpen]);

  useEffect(() => {
    if (outfits.length === 0) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  { directionRef.current = 'left';  setCurrentIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { directionRef.current = 'right'; setCurrentIdx(i => Math.min(outfits.length - 1, i + 1)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [outfits.length]);

  useEffect(() => {
    if (!wornTodayKey) return;
    try { localStorage.setItem(wornTodayKey, JSON.stringify([...wornItemIds])); } catch {}
  }, [wornItemIds, wornTodayKey]);

  const saveLocation = (loc) => {
    try { localStorage.setItem(locationKey, JSON.stringify(loc)); } catch {}
    setLocation(loc);
  };

  const handleSelectLocation = ({ city, lat, lon }) => {
    saveLocation({ city, lat, lon });
    setWeatherSummary(null);
  };

  const handleCitySearch = async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const [result] = await res.json();
      if (result) {
        const addr = result.address || {};
        const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
        const region = addr.state_code || addr.state || '';
        saveLocation({ city: region ? `${name}, ${region}` : name, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
      } else {
        saveLocation({ ...location, city: query });
      }
      setWeatherSummary(null);
    } catch {
      saveLocation({ ...location, city: query });
      setWeatherSummary(null);
    }
  };

  const handleWeatherReady = (d) => {
    const tempF = Math.round(d.current.temperature_2m);
    const highF = Math.round(d.daily.temperature_2m_max[0]);
    const lowF  = Math.round(d.daily.temperature_2m_min[0]);
    const { label: conditionLabel } = wmoCondition(d.current.weather_code);

    const now      = Date.now();
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    let worstCode  = d.current.weather_code;
    for (let i = 0; i < d.hourly.time.length; i++) {
      const t = new Date(d.hourly.time[i]).getTime();
      if (t >= now && t < midnight.getTime() && d.hourly.weather_code[i] > worstCode) {
        worstCode = d.hourly.weather_code[i];
      }
    }
    const laterCondition = worstCode !== d.current.weather_code
      ? wmoCondition(worstCode).label
      : null;

    setWeatherSummary({ tempF, conditionLabel, highF, lowF, laterCondition });
  };

  const itemById = {};
  for (const item of items) itemById[item.id] = item;

  const outfit = outfits[currentIdx] ?? null;
  const outfitItems = outfit ? (outfit.itemIds ?? []).map(id => itemById[id]).filter(Boolean) : [];

  useEffect(() => { setSaveState('idle'); }, [currentIdx]);

  const handleSave = async () => {
    if (!outfit || !outfitItems.length || saveState !== 'idle') return;
    setSaveState('saving');
    const canvasItems = aiOutfitToCanvasItems(outfitItems);
    await onSaveToPublished?.({
      name: outfit.outfitName,
      items: canvasItems,
      bgColor: '#FFFFFF',
      canvasWidth: DESIGN_W,
      canvasHeight: DESIGN_H,
      thumbnail: '',
    });
    setSaveState('saved');
    setTimeout(() => { setSaveState('idle'); }, 2800);
  };

  const handleEdit = () => {
    if (!outfit || !outfitItems.length) return;
    const canvasItems = aiOutfitToCanvasItems(outfitItems);
    onEditInStudio?.({
      name: outfit.outfitName,
      items: canvasItems,
      bgColor: '#FFFFFF',
      canvasWidth: DESIGN_W,
      canvasHeight: DESIGN_H,
    });
  };

  const handleWoreThis = () => {
    if (!outfitItems.length) return;
    setWornItemIds(new Set(outfitItems.map(i => String(i.id))));
    setTimeout(() => wornSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const todayLogs = wearLogs.filter(l => l.worn_date === today);

  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onLogWorn?.({ itemIds: [...wornItemIds], source: 'today_auto', replace: true });
    }, 700);
    return () => clearTimeout(saveTimerRef.current);
  }, [wornItemIds]);

  useEffect(() => {
    if (!pickerFilterOpen) return;
    const handler = e => { if (!pickerFilterRef.current?.contains(e.target)) setPickerFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerFilterOpen]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-28 md:pb-8">

      <div className="flex flex-col">

      {/* Title */}
      <div className="px-6 md:px-8 pt-8 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Today's Looks</h1>
          <p className="text-sm text-gray-400 mt-0.5">Curated from your wardrobe</p>
        </div>
        {isPreview ? (
          <div className="relative flex-shrink-0" ref={locationMenuRef}>
            <button
              onClick={() => setLocationMenuOpen(o => !o)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5"
            >
              <MapPin size={15} className="text-gray-500 flex-shrink-0" />
              <span className="text-base text-gray-600 max-w-[220px] truncate">{location.city ?? 'Select city'}</span>
              <ChevronDown size={15} strokeWidth={2} className={`text-gray-400 flex-shrink-0 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {locationMenuOpen && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[180px] z-20">
                {PRESET_LOCATIONS.map(l => (
                  <button
                    key={l.city}
                    onClick={() => { saveLocation(l); setWeatherSummary(l.weather ?? null); setLocationMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                  >
                    {l.city}
                    {location.city === l.city && <Check size={13} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <LocationBar
            city={location.city}
            onCommit={handleCitySearch}
            onSelectLocation={handleSelectLocation}
          />
        )}
        {/* hidden weather widget for auth users — fires onWeatherReady to trigger outfit gen */}
        {!isPreview && (
          <div className="hidden">
            <WeatherWidget
              compact
              lat={location.lat}
              lon={location.lon}
              city={location.city}
              onCommit={handleCitySearch}
              onSelectLocation={handleSelectLocation}
              onWeatherReady={handleWeatherReady}
            />
          </div>
        )}
      </div>

      {/* Outfit section */}
      <div className="flex flex-col gap-4 pl-6 md:pl-8 pr-6 md:pr-10">

        {items.length < 3 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-8 py-20 text-center w-full">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Shirt size={28} className="text-gray-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">Your wardrobe needs a few more pieces</p>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Add more items to unlock daily style inspiration tailored to the weather.
              </p>
            </div>
          </div>
        )}

        {items.length >= 3 && !genError && (generating || !outfits.length || !weatherSummary) && (
          <GeneratingSkeleton city={location.city} weatherSummary={weatherSummary} />
        )}

        {items.length >= 3 && !generating && genError && (
          <div className="flex flex-col items-center justify-center text-center px-8 py-20 flex-1">
            <p className="text-5xl mb-6">✦</p>
            {genError.includes('No valid outfits') ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 leading-snug">
                  Nothing quite fits today's weather
                </h2>
                <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                  {isPreview
                    ? 'Try switching to a different city to see outfits suited to that climate.'
                    : 'Add a few more pieces to your wardrobe — a mix of tops, bottoms, and a pair of shoes is all it takes.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 leading-snug">
                  Couldn't reach the stylist
                </h2>
                <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                  Something went wrong on our end. Your wardrobe is fine — give it a moment and try again.
                </p>
              </>
            )}
            <button
              onClick={() => { setGenError(null); setRetryKey(k => k + 1); }}
              className="mt-8 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {items.length >= 3 && !generating && outfits.length > 0 && weatherSummary && (
          <FadeIn>
          <div className="flex flex-col items-center [@media(min-width:1000px)_and_(min-height:680px)]:flex-row [@media(min-width:1000px)_and_(min-height:680px)]:items-stretch">
            {/* Collage */}
            <div key={`collage-${currentIdx}`} className={directionRef.current === 'right' ? 'outfit-enter-right' : 'outfit-enter-left'}>
              {outfitItems.length > 0 ? (
                <OutfitCollage items={outfitItems} />
              ) : (
                <div className="rounded-3xl bg-white flex-shrink-0 flex items-center justify-center"
                  style={{ height: Math.round(DESIGN_H * collageScale), width: Math.round(DESIGN_H * collageScale * 210 / 297) }}>
                  <p className="text-sm text-gray-400">No items found</p>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex-1 min-w-0 flex flex-col items-start px-5 pt-4 pb-0 [@media(min-width:1000px)_and_(min-height:680px)]:pl-8 [@media(min-width:1000px)_and_(min-height:680px)]:pt-0">
              {/* Counter */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1">
                {currentIdx + 1} of {outfits.length}
              </p>
              {/* Outfit name */}
              <h3 key={`name-${currentIdx}`} className="text-base font-semibold text-gray-900 leading-snug mb-3 outfit-text-fade">
                {outfit.outfitName}
              </h3>
              {/* Nav arrows */}
              <div className="flex gap-1.5 mb-4">
                <button
                  onClick={() => navigate(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={() => navigate(Math.min(outfits.length - 1, currentIdx + 1))}
                  disabled={currentIdx === outfits.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>
              {/* Dot indicators */}
              <div className="flex gap-1.5 mb-5">
                {outfits.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(i)}
                    className={`rounded-full transition-all ${
                      i === currentIdx
                        ? 'w-4 h-1.5 bg-gray-800'
                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              {/* Description */}
              <div key={`desc-${currentIdx}`} className="h-24 mb-3 flex items-start justify-center overflow-hidden outfit-text-fade">
                {outfit.description && (
                  <p className="text-sm text-gray-500 leading-relaxed text-center">{outfit.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 justify-center">
                {/* Save */}
                <div className="relative group">
                  <button
                    onClick={handleSave}
                    disabled={saveState !== 'idle'}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors
                      ${saveState === 'saved'
                        ? 'border-green-200 bg-green-50 text-green-500'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                  >
                    {saveState === 'saved'
                      ? <Check size={15} strokeWidth={2.5} />
                      : <Bookmark size={15} strokeWidth={1.8} />
                    }
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {saveState === 'saved' ? 'Saved!' : 'Save to Outfits'}
                  </span>
                </div>

                {/* Edit in Studio */}
                <div className="relative group">
                  <button
                    onClick={handleEdit}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Pencil size={14} strokeWidth={1.8} />
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit Outfit
                  </span>
                </div>

                {/* I Wore This */}
                {!isPreview && (
                  <div className="relative group">
                    <button
                      onClick={handleWoreThis}
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <CheckCircle2 size={14} strokeWidth={1.8} />
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      I Wore This
                    </span>
                  </div>
                )}
              </div>

              {/* Weather Report */}
              {(() => {
                const meta = CONDITION_LABEL_META[weatherSummary.conditionLabel] ?? CONDITION_LABEL_META['Clear'];
                const CondIcon = meta.Icon;
                return (
                  <div className="mt-5 w-full">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-2">Weather Report</p>
                    <div className="rounded-3xl overflow-hidden" style={{ background: meta.bg }}>
                      <div className="px-6 pt-5">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-white/60 flex-shrink-0" />
                          <span className="text-sm font-medium text-white/80 tracking-wide">{location.city}</span>
                        </div>
                      </div>
                      <div className="px-6 pt-3 pb-5 flex items-center justify-between">
                        <div className="flex items-start">
                          <span className="text-[68px] font-thin text-white leading-none tracking-tight">{weatherSummary.tempF}</span>
                          <span className="text-xl font-light text-white/60 mt-3 ml-0.5">°F</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <CondIcon size={20} className="text-white/90" strokeWidth={1.8} />
                            <span className="text-[17px] font-medium text-white">{weatherSummary.conditionLabel}</span>
                          </div>
                          <p className="text-sm text-white/60 font-medium tracking-wide">H: {weatherSummary.highF}°  ·  L: {weatherSummary.lowF}°</p>
                          {weatherSummary.laterCondition && (
                            <p className="text-xs text-white/50 mt-0.5">{weatherSummary.laterCondition} later</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          </FadeIn>
        )}

      </div>

      </div>

      {/* ── What I Wore Today ── */}
      {!isPreview && (
        <div ref={wornSectionRef} className="mt-24 px-6 md:px-8 pb-4">
          {/* Header row */}
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">What I Wore Today</h2>
            <p className="text-sm text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Selected items */}
          {wornItemIds.size > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-3 mb-5 min-h-[124px]">
              {items.filter(i => wornItemIds.has(String(i.id))).map(item => (
                <div key={item.id} className="flex-shrink-0 relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border-2 border-gray-900">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />}
                  </div>
                  <button
                    onClick={() => setWornItemIds(prev => { const n = new Set(prev); n.delete(String(item.id)); return n; })}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X size={9} strokeWidth={2.5} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl px-5 text-center mb-5 min-h-[124px] flex items-center justify-center">
              <p className="text-sm text-gray-400 leading-relaxed">
                Tap "I Wore This" on a suggested outfit above, or pick items from your wardrobe below.
              </p>
            </div>
          )}

          {/* Mini wardrobe picker */}
          {items.length > 0 && (() => {
            const availableBoards = boards.length > 0
              ? boards
              : ['All', ...new Set(items.flatMap(i => i.boards ?? []).filter(Boolean))];
            const q = pickerSearch.toLowerCase();
            const pickerItems = items.filter(i => {
              if (pickerBoard !== 'All' && !(i.boards ?? []).includes(pickerBoard)) return false;
              if (pickerFavoritesOnly && !likedItems.has(i.id)) return false;
              if (pickerCategoryFilter.size > 0 && !pickerCategoryFilter.has(i.category)) return false;
              if (q) return (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
              return true;
            });
            return (
              <div>
                {/* Board tabs */}
                <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-3">
                  {availableBoards.map(b => {
                    const active = pickerBoard === b;
                    return (
                      <button
                        key={b}
                        onClick={() => setPickerBoard(b)}
                        className={`flex-shrink-0 text-base font-medium transition-colors pb-0.5 ${
                          active
                            ? 'text-gray-900 border-b-2 border-gray-900'
                            : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                {/* Favorites + Filter + Search */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setPickerFavoritesOnly(o => !o)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                      pickerFavoritesOnly ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Heart size={13} className={pickerFavoritesOnly ? 'fill-rose-500' : ''} />
                    Favorites
                  </button>
                  <div className="relative flex-shrink-0" ref={pickerFilterRef}>
                    <button
                      onClick={() => setPickerFilterOpen(o => !o)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        pickerCategoryFilter.size > 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <SlidersHorizontal size={13} />
                      Filter{pickerCategoryFilter.size > 0 ? ` · ${pickerCategoryFilter.size}` : ''}
                    </button>
                    {pickerFilterOpen && (
                      <div className="absolute left-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56 z-20 max-h-48 overflow-y-auto scrollbar-hide">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setPickerCategoryFilter(prev => {
                              const n = new Set(prev);
                              n.has(cat) ? n.delete(cat) : n.add(cat);
                              return n;
                            })}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <span className={pickerCategoryFilter.has(cat) ? 'text-gray-900 font-medium text-sm' : 'text-gray-600 text-sm'}>{cat}</span>
                            {pickerCategoryFilter.has(cat) && <Check size={14} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                          </button>
                        ))}
                        {pickerCategoryFilter.size > 0 && (
                          <button
                            onClick={() => { setPickerCategoryFilter(new Set()); setPickerFilterOpen(false); }}
                            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 border-t border-gray-100 mt-1"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder="Search…"
                    className="flex-1 text-sm px-3 py-1.5 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-400"
                  />
                </div>

                {/* Grid */}
                <div className="wardrobe-picker-grid">
                  {pickerItems.map(item => {
                    const selected = wornItemIds.has(String(item.id));
                    return (
                      <button
                        key={item.id}
                        onClick={() => setWornItemIds(prev => {
                          const n = new Set(prev); selected ? n.delete(String(item.id)) : n.add(String(item.id)); return n;
                        })}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selected ? 'border-gray-900 shadow-md' : 'border-transparent bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />}
                        {selected && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <Check size={9} strokeWidth={3} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {pickerItems.length === 0 && (
                    <p className="col-span-full text-sm text-gray-400 text-center py-6">No items match</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
