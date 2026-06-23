import React, { useState, useEffect, useRef } from 'react';
import { Loader2, User, ChevronRight } from 'lucide-react';
import { supabase } from './supabase.js';
import { GLOBAL_CSS, BOARDS, ITEMS, TABS, DEMO_WEAR_LOGS, OUTFIT_GOALS, getCurrencySymbol } from './lib/constants.js';
import { aiOutfitToCanvasItems, DESIGN_W, DESIGN_H } from './lib/collage.jsx';
import { dbItemToApp, dbOutfitToApp, collageToDbPayload } from './lib/db.js';
import { startBgRemoval, trimTransparentPixels, enrichItem } from './lib/image.js';
import { WardrobeTab } from './components/WardrobeTab.jsx';
import { TodayTab } from './components/TodayTab.jsx';
import { StudioTab } from './components/StudioTab.jsx';
import { StylistTab, DemoStylistTab } from './components/StylistTab.jsx';
import { AnalyticsTab } from './components/AnalyticsTab.jsx';
import { ProfileTab } from './components/ProfileTab.jsx';
import { ItemModal } from './components/modals/ItemModal.jsx';
import { AuthModal } from './components/modals/AuthModal.jsx';
import { OnboardingModal } from './components/modals/OnboardingModal.jsx';
import { AddMethodModal } from './components/modals/AddMethodModal.jsx';
import { AddFromLinkModal } from './components/modals/AddFromLinkModal.jsx';
import { AddItemModal } from './components/modals/AddItemModal.jsx';

export default function WardrobeApp() {
  const [user, setUser]                   = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const authInitializedRef                = useRef(false);
  const currentUserIdRef                  = useRef(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab]         = useState(() => {
    try {
      const saved = localStorage.getItem('wardrobe_active_tab');
      if (saved && ['today', 'wardrobe', 'studio', 'analytics', 'stylist', 'profile'].includes(saved)) return saved;
    } catch {}
    return 'today';
  });
  const [mountedTabs, setMountedTabs]     = useState(() => {
    try {
      const saved = localStorage.getItem('wardrobe_active_tab');
      if (saved && ['today', 'wardrobe', 'studio', 'analytics', 'stylist', 'profile'].includes(saved)) {
        return new Set(['today', saved]);
      }
    } catch {}
    return new Set(['today']);
  });
  const [selectedItem, setSelectedItem]   = useState(null);
  const [items, setItems]                 = useState([]);
  const [addStep, setAddStep]                 = useState(null);
  const [addItemFile, setAddItemFile]         = useState(null);
  const [addItemProcessing, setAddItemProcessing] = useState(null);
  const [addItemPrefill, setAddItemPrefill]   = useState(null);
  const [addLinkScraped, setAddLinkScraped]   = useState(null);
  const [boards, setBoards]               = useState(['All']);
  const [boardMeta, setBoardMeta]         = useState({});
  const [profile, setProfile]             = useState({
    name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', avatarUrl: '',
    country: '', outfitGoals: [], stylePreference: '',
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingOutfitItem, setPendingOutfitItem] = useState(null);
  const [pendingTargetCollage, setPendingTargetCollage] = useState(null);
  const [pendingAiCollage, setPendingAiCollage] = useState(null);
  const [savedOutfits, setSavedOutfits]   = useState([]);
  const [draftOutfits, setDraftOutfits]   = useState([]);
  const [previewDraftOutfits, setPreviewDraftOutfits] = useState([]);
  const [previewSavedOutfits, setPreviewSavedOutfits] = useState(() => {
    const byId = {};
    for (const item of ITEMS) byId[item.id] = item;
    const build = (id, name, ids) => {
      const outfitItems = ids.map(i => byId[i]).filter(Boolean);
      return { id, name, items: aiOutfitToCanvasItems(outfitItems), bgColor: '#FFFFFF', canvasWidth: DESIGN_W, canvasHeight: DESIGN_H, liked: false, boards: [], thumbnail: '' };
    };
    return [
      build('preview-1', 'Weekend Casual', [11, 26, 27, 38]),
      build('preview-2', 'Work Ready',     [8, 14, 1, 13]),
    ];
  });
  const [likedItems, setLikedItems]       = useState(() => new Set());
  const [wearLogs, setWearLogs]           = useState([]);
  const [outfitBoards, setOutfitBoards]       = useState(['All']);
  const [outfitBoardMeta, setOutfitBoardMeta] = useState({});
  const [likedOutfits, setLikedOutfits]       = useState(() => new Set());

  // ── Auth + data loading ──────────────────────────────────────────────────
  const loadUserData = async (u) => {
    const uid = u.id;
    const [profileRes, itemsRes, boardsRes, outfitsRes, outfitBoardsRes, wearLogsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('items').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('boards').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('outfits').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('outfit_boards').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('wear_logs').select('*').eq('user_id', uid).order('worn_date', { ascending: false }).limit(500),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      setProfile({
        name: p.name ?? '', bio: p.bio ?? '', topSize: p.top_size ?? '', bottomSize: p.bottom_size ?? '', shoeSize: p.shoe_size ?? '',
        avatarUrl: u.user_metadata?.avatar_url || '',
        country: u.user_metadata?.country || '',
        outfitGoals: u.user_metadata?.outfit_goals || [],
        stylePreference: u.user_metadata?.style_preference || '',
      });
    }

    if (itemsRes.data) {
      const appItems = itemsRes.data.map(dbItemToApp);
      setItems(appItems);
      setLikedItems(new Set(appItems.filter(i => i.liked).map(i => i.id)));
    }

    if (boardsRes.data) {
      setBoards(['All', ...boardsRes.data.map(b => b.name)]);
      const meta = {};
      boardsRes.data.forEach(b => { if (b.description) meta[b.name] = { description: b.description }; });
      setBoardMeta(meta);
    }

    if (outfitsRes.data) {
      const allAppOutfits = outfitsRes.data.map(dbOutfitToApp);
      const rawRows = outfitsRes.data;
      setSavedOutfits(allAppOutfits.filter((_, i) => !rawRows[i].is_draft));
      setDraftOutfits(allAppOutfits.filter((_, i) =>  rawRows[i].is_draft));
      setLikedOutfits(new Set(allAppOutfits.filter(o => o.liked).map(o => o.id)));
    }

    if (outfitBoardsRes.data) {
      setOutfitBoards(['All', ...outfitBoardsRes.data.map(b => b.name)]);
      const meta = {};
      outfitBoardsRes.data.forEach(b => { if (b.description) meta[b.name] = { description: b.description }; });
      setOutfitBoardMeta(meta);
    }

    if (wearLogsRes.error) console.error('[wear_logs] fetch failed:', wearLogsRes.error.message, '— run supabase/migrations/20260621_wear_logs.sql in the dashboard');
    if (wearLogsRes.data) setWearLogs(wearLogsRes.data);
  };

  // Capture extension data from URL on first load and stash in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('ext_data');
    if (!raw) return;
    window.history.replaceState({}, '', window.location.pathname);
    try {
      const data = JSON.parse(decodeURIComponent(raw));
      sessionStorage.setItem('wardrobeExtData', JSON.stringify(data));
    } catch {}
  }, []);

  // Once the user is confirmed logged in, open the image picker with any pending extension data.
  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem('wardrobeExtData');
    if (!raw) return;
    sessionStorage.removeItem('wardrobeExtData');
    try {
      const data = JSON.parse(raw);
      const prefill = {
        name: data.name || '', brand: data.brand || '', price: data.price || '',
        material: data.material || '', size: data.size || '',
      };
      if (data.selectedImage) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          fetch(`/api/proxy-image?url=${encodeURIComponent(data.selectedImage)}`, {
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
          })
            .then(res => res.ok ? res.blob() : Promise.reject())
            .then(blob => {
              const file = new File([blob], 'product.jpg', { type: blob.type || 'image/jpeg' });
              setAddItemFile(file);
              setAddItemProcessing(startBgRemoval(file));
              setAddItemPrefill(prefill);
              setAddLinkScraped(data);
              setAddStep('form');
            })
            .catch(() => {
              setAddLinkScraped(data);
              setAddStep('link');
            });
        });
      } else {
        setAddLinkScraped(data);
        setAddStep('link');
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      currentUserIdRef.current = u?.id ?? null;
      setUser(u);
      if (u) {
        await loadUserData(u);
        if (u.user_metadata?.onboarding_complete === false) {
          switchTab('wardrobe');
          setShowOnboarding(true);
        }
      }
      setAuthLoading(false);
      authInitializedRef.current = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      const u = session?.user ?? null;
      const prevId = currentUserIdRef.current;
      currentUserIdRef.current = u?.id ?? null;
      setUser(u);
      if (u) {
        if (authInitializedRef.current && event === 'SIGNED_IN' && u.id !== prevId) {
          setShowAuthModal(false);
          setTransitioning(true);
          await loadUserData(u);
          setTransitioning(false);
          if (u.user_metadata?.onboarding_complete === false) {
            switchTab('wardrobe');
            setShowOnboarding(true);
          }
        }
      } else {
        setItems([]); setBoards(['All']); setBoardMeta({});
        setSavedOutfits([]); setDraftOutfits([]); setLikedItems(new Set());
        setOutfitBoards(['All']); setOutfitBoardMeta({}); setLikedOutfits(new Set());
        setProfile({ name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', avatarUrl: '', country: '', outfitGoals: [] });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Board handlers ───────────────────────────────────────────────────────
  const handleDeleteBoard = async name => {
    setBoards(prev => prev.filter(b => b !== name));
    setBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
    if (user) await supabase.from('boards').delete().eq('user_id', user.id).eq('name', name);
  };

  const handleToggleItemBoard = async (itemId, board) => {
    let nextBoards;
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const inBoard = i.boards.includes(board);
      nextBoards = inBoard ? i.boards.filter(b => b !== board) : [...i.boards, board];
      return { ...i, boards: nextBoards };
    }));
    setSelectedItem(prev => {
      if (prev?.id !== itemId) return prev;
      const inBoard = prev.boards.includes(board);
      return { ...prev, boards: inBoard ? prev.boards.filter(b => b !== board) : [...prev.boards, board] };
    });
    if (user && nextBoards !== undefined) {
      await supabase.from('items').update({ board_names: nextBoards }).eq('id', itemId).eq('user_id', user.id);
    }
  };

  const handleCreateBoard = async (name, description) => {
    setBoards(prev => [...prev, name]);
    if (description) setBoardMeta(prev => ({ ...prev, [name]: { description } }));
    if (user) await supabase.from('boards').insert({ user_id: user.id, name, description: description || '' });
  };

  const handleEditBoard = async (oldName, newName, description) => {
    setBoards(prev => prev.map(b => b === oldName ? newName : b));
    setItems(prev => prev.map(i => ({ ...i, boards: i.boards.map(b => b === oldName ? newName : b) })));
    setBoardMeta(prev => {
      const next = { ...prev };
      delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
    if (user) {
      await supabase.from('boards').update({ name: newName, description: description || '' }).eq('user_id', user.id).eq('name', oldName);
      const affectedItems = items.filter(i => i.boards.includes(oldName));
      await Promise.all(affectedItems.map(i =>
        supabase.from('items').update({ board_names: i.boards.map(b => b === oldName ? newName : b) }).eq('id', i.id).eq('user_id', user.id)
      ));
    }
  };

  const handleDeleteItems = async (ids, board) => {
    if (board === 'All') {
      setItems(prev => prev.filter(i => !ids.has(i.id)));
      setLikedItems(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
      if (user) await supabase.from('items').delete().in('id', [...ids]).eq('user_id', user.id);
    } else {
      setItems(prev => prev.map(i => ids.has(i.id) ? { ...i, boards: i.boards.filter(b => b !== board) } : i));
      if (user) {
        const affectedItems = items.filter(i => ids.has(i.id));
        await Promise.all(affectedItems.map(i =>
          supabase.from('items').update({ board_names: i.boards.filter(b => b !== board) }).eq('id', i.id).eq('user_id', user.id)
        ));
      }
    }
  };

  // ── Item handlers ────────────────────────────────────────────────────────
  const toggleLike = async id => {
    const nowLiked = !likedItems.has(id);
    setLikedItems(prev => { const next = new Set(prev); nowLiked ? next.add(id) : next.delete(id); return next; });
    if (user) await supabase.from('items').update({ liked: nowLiked }).eq('id', id).eq('user_id', user.id);
  };

  const updateItem = async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    if (user) {
      const dbUpdates = {};
      if (updates.name      !== undefined) dbUpdates.name      = updates.name;
      if (updates.brand     !== undefined) dbUpdates.brand     = updates.brand;
      if (updates.price     !== undefined) dbUpdates.price     = updates.price;
      if (updates.size      !== undefined) dbUpdates.size      = updates.size;
      if (updates.material  !== undefined) dbUpdates.material  = updates.material;
      if (updates.color     !== undefined) dbUpdates.color     = updates.color;
      if (updates.category  !== undefined) dbUpdates.category  = updates.category;
      if (updates.notes     !== undefined) dbUpdates.notes     = updates.notes;
      if (Object.keys(dbUpdates).length) {
        await supabase.from('items').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      }
    }
  };

  const deleteItem = async id => {
    setItems(prev => prev.filter(i => i.id !== id));
    setLikedItems(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSelectedItem(null);
    if (user) await supabase.from('items').delete().eq('id', id).eq('user_id', user.id);
  };

  const updateItemImage = async (id, blob) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-edited.png`;
    const file = await trimTransparentPixels(new File([blob], 'edited.png', { type: 'image/png' }));
    const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadErr) { console.error('Image upload error:', uploadErr); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
    setItems(prev => prev.map(i => i.id === id ? { ...i, image: publicUrl } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, image: publicUrl } : prev);
    await supabase.from('items').update({ image_url: publicUrl }).eq('id', id).eq('user_id', user.id);

    const patchOutfits = (outfits, setOutfits) => {
      const changed = [];
      const next = outfits.map(o => {
        const newItems = o.items.map(ci => ci.id === id ? { ...ci, image: publicUrl } : ci);
        const dirty = newItems.some((ci, i) => ci !== o.items[i]);
        if (dirty) { changed.push({ ...o, items: newItems }); return { ...o, items: newItems }; }
        return o;
      });
      if (changed.length) setOutfits(next);
      return changed;
    };
    const changedSaved = patchOutfits(savedOutfits, setSavedOutfits);
    const changedDraft = patchOutfits(draftOutfits, setDraftOutfits);
    await Promise.all([
      ...changedSaved.map(o => supabase.from('outfits').update({ canvas_items: collageToDbPayload(o) }).eq('id', o.id)),
      ...changedDraft.map(o => supabase.from('outfits').update({ canvas_items: collageToDbPayload(o) }).eq('id', o.id)),
    ]);
  };

  const addItem = async (form, imageFile, imageProcessingPromise) => {
    const tempId = `temp-${Date.now()}`;
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : '';
    setItems(prev => [{
      id: tempId, ...form, image: previewUrl, boards: [], liked: false, ratio: 'portrait',
      attributes: { warmthRating: 'none' },
      _enriching: true,
      _bgRemoving: !!imageProcessingPromise,
    }, ...prev]);

    try {
      let finalImageFile = imageFile;
      if (imageProcessingPromise) {
        try {
          const { processedFile } = await imageProcessingPromise;
          finalImageFile = processedFile;
          const processedUrl = URL.createObjectURL(finalImageFile);
          setItems(prev => prev.map(i => i.id === tempId ? { ...i, image: processedUrl, _bgRemoving: false } : i));
        } catch {
          setItems(prev => prev.map(i => i.id === tempId ? { ...i, _bgRemoving: false } : i));
        }
      }

      let imageUrl = '';
      if (finalImageFile && user) {
        const safeName = finalImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, finalImageFile);
        if (!uploadErr) {
          imageUrl = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl;
        }
      }

      const { data: dbItem, error: dbErr } = await supabase.from('items').insert({
        user_id: user.id,
        name: form.name, brand: form.brand, price: form.price, size: form.size,
        material: form.material, color: form.color, category: form.category, notes: form.notes,
        image_url: imageUrl, liked: false, board_names: [],
        attributes: { warmthRating: 'none' },
      }).select().single();

      if (dbErr) throw dbErr;

      setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: dbItem.id, image: imageUrl || previewUrl } : i));

      const result = await enrichItem({
        imageUrl: imageUrl || null,
        imageFile: imageUrl ? null : finalImageFile,
        name: form.name, brand: form.brand, category: form.category, material: form.material, color: form.color,
      });

      setItems(prev => prev.map(i => i.id === dbItem.id ? { ...i, ...result, _enriching: false } : i));
      await supabase.from('items').update({ attributes: result.attributes }).eq('id', dbItem.id);
    } catch (err) {
      console.error('addItem error:', err);
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, _enriching: false } : i));
    }
  };

  // ── Outfit handlers ──────────────────────────────────────────────────────
  const handleAddToOutfit = item => {
    setPendingOutfitItem(item);
    setPendingTargetCollage(null);
    switchTab('studio');
    setSelectedItem(null);
  };

  const handleOpenExistingCollage = (item, outfit, type) => {
    setPendingOutfitItem(item);
    setPendingTargetCollage({ id: outfit.id, type });
    switchTab('studio');
    setSelectedItem(null);
  };

  // ── Outfit board handlers ─────────────────────────────────────────────────
  const handleCreateOutfitBoard = async (name, description) => {
    setOutfitBoards(prev => [...prev, name]);
    if (description) setOutfitBoardMeta(prev => ({ ...prev, [name]: { description } }));
    if (user) await supabase.from('outfit_boards').insert({ user_id: user.id, name, description: description || '' });
  };

  const handleDeleteOutfitBoard = async name => {
    setOutfitBoards(prev => prev.filter(b => b !== name));
    setOutfitBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
    const strip = list => list.map(o => ({ ...o, boards: o.boards.filter(b => b !== name) }));
    setSavedOutfits(prev => strip(prev));
    setDraftOutfits(prev => strip(prev));
    if (user) {
      await supabase.from('outfit_boards').delete().eq('user_id', user.id).eq('name', name);
      const affected = [...savedOutfits, ...draftOutfits].filter(o => o.boards.includes(name));
      await Promise.all(affected.map(o =>
        supabase.from('outfits').update({ board_names: o.boards.filter(b => b !== name) }).eq('id', o.id)
      ));
    }
  };

  const handleEditOutfitBoard = async (oldName, newName, description) => {
    setOutfitBoards(prev => prev.map(b => b === oldName ? newName : b));
    setOutfitBoardMeta(prev => {
      const next = { ...prev }; delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
    const rename = list => list.map(o => ({ ...o, boards: o.boards.map(b => b === oldName ? newName : b) }));
    setSavedOutfits(prev => rename(prev));
    setDraftOutfits(prev => rename(prev));
    if (user) {
      await supabase.from('outfit_boards').update({ name: newName, description: description || '' }).eq('user_id', user.id).eq('name', oldName);
      const affected = [...savedOutfits, ...draftOutfits].filter(o => o.boards.includes(oldName));
      await Promise.all(affected.map(o =>
        supabase.from('outfits').update({ board_names: o.boards.map(b => b === oldName ? newName : b) }).eq('id', o.id)
      ));
    }
  };

  const handleToggleOutfitBoard = async (outfitId, board) => {
    let nextBoards;
    const toggle = list => list.map(o => {
      if (o.id !== outfitId) return o;
      const inBoard = o.boards.includes(board);
      nextBoards = inBoard ? o.boards.filter(b => b !== board) : [...o.boards, board];
      return { ...o, boards: nextBoards };
    });
    setSavedOutfits(prev => toggle(prev));
    setDraftOutfits(prev => toggle(prev));
    if (user && nextBoards !== undefined)
      await supabase.from('outfits').update({ board_names: nextBoards }).eq('id', outfitId).eq('user_id', user.id);
  };

  const toggleOutfitLike = async id => {
    const nowLiked = !likedOutfits.has(id);
    setLikedOutfits(prev => { const next = new Set(prev); nowLiked ? next.add(id) : next.delete(id); return next; });
    if (user) await supabase.from('outfits').update({ liked: nowLiked }).eq('id', id).eq('user_id', user.id);
  };

  const handleLogWorn = async ({ itemIds, outfitId = null, source = 'manual', replace = false }) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    if (replace) {
      const { error: delErr } = await supabase
        .from('wear_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('worn_date', today);
      if (delErr) console.error('[wear_logs] delete failed:', delErr.message);
      else setWearLogs(prev => prev.filter(l => l.worn_date !== today));
    }
    if (!itemIds?.length) return;
    const { data, error } = await supabase
      .from('wear_logs')
      .insert({ user_id: user.id, worn_date: today, item_ids: itemIds.map(String), outfit_id: outfitId ?? null, source })
      .select()
      .single();
    if (error) console.error('[wear_logs] insert failed:', error.message, '— run supabase/migrations/20260621_wear_logs.sql in the dashboard');
    if (data) setWearLogs(prev => [data, ...prev]);
  };

  const handleSaveOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage),
      thumbnail: collage.thumbnail || '', is_draft: false, liked: false, board_names: [],
    }).select().single();
    if (data) setSavedOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const handleSaveDraftOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage),
      thumbnail: collage.thumbnail || '', is_draft: true, liked: false, board_names: [],
    }).select().single();
    if (data) setDraftOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const updateSavedOutfit = async (id, collage) => {
    setSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const updateDraftOutfit = async (id, collage) => {
    setDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const handleRemoveDraftOutfit = async id => {
    setDraftOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  const handleRemoveSavedOutfit = async id => {
    setSavedOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  // ── Profile handlers ──────────────────────────────────────────────────────
  const handleUpdateProfile = async updates => {
    const VALID_GOAL_IDS  = new Set(OUTFIT_GOALS.map(g => g.id));
    const VALID_STYLE_IDS = new Set(['feminine', 'masculine', 'neutral']);
    const safe = {
      ...updates,
      name: String(updates.name ?? '').trim().slice(0, 60),
      bio: String(updates.bio ?? '').trim().slice(0, 160),
      topSize: String(updates.topSize ?? '').trim().slice(0, 20),
      bottomSize: String(updates.bottomSize ?? '').trim().slice(0, 20),
      shoeSize: String(updates.shoeSize ?? '').trim().slice(0, 20),
      outfitGoals: Array.isArray(updates.outfitGoals)
        ? updates.outfitGoals.filter(id => VALID_GOAL_IDS.has(id))
        : [],
      stylePreference: VALID_STYLE_IDS.has(updates.stylePreference) ? updates.stylePreference : '',
    };
    setProfile(safe);
    if (user) {
      const [{ error: profileErr }] = await Promise.all([
        supabase.from('profiles').upsert({
          id: user.id,
          name: safe.name, bio: safe.bio,
          top_size: safe.topSize, bottom_size: safe.bottomSize, shoe_size: safe.shoeSize,
        }, { onConflict: 'id' }),
        supabase.auth.updateUser({ data: {
          country: updates.country,
          outfit_goals: safe.outfitGoals,
          style_preference: safe.stylePreference,
        }}),
      ]);
      if (profileErr) console.error('Profile save failed:', profileErr.message);
    }
  };

  const handleCompleteOnboarding = async ({ bio, country, stylePreference, outfitGoals }) => {
    const nameFromMeta = user?.user_metadata?.name || '';
    setProfile(prev => ({ ...prev, name: nameFromMeta || prev.name, bio, country, stylePreference, outfitGoals }));
    if (user) {
      const [, { error: authErr }] = await Promise.all([
        supabase.from('profiles').upsert({
          id: user.id,
          name: user.user_metadata?.name || profile.name || '',
          bio,
          top_size: profile.topSize, bottom_size: profile.bottomSize, shoe_size: profile.shoeSize,
          styles: [],
        }),
        supabase.auth.updateUser({ data: {
          country,
          style_preference: stylePreference,
          outfit_goals: outfitGoals,
          onboarding_complete: true,
        }}),
      ]);
      if (authErr) {
        const { error: retryErr } = await supabase.auth.updateUser({ data: {
          country,
          style_preference: stylePreference,
          outfit_goals: outfitGoals,
          onboarding_complete: true,
        }});
        if (retryErr) console.error('Onboarding save failed:', retryErr.message);
      }
    }
    setShowOnboarding(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      });
    } catch {}
    await supabase.auth.signOut();
    switchTab('today');
  };

  const handleUpdateAvatar = async (file) => {
    if (!user || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadErr) { console.error('Avatar upload failed:', uploadErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
    return publicUrl;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    switchTab('wardrobe');
  };

  const switchTab = (id) => {
    setMountedTabs(prev => { const next = new Set(prev); next.add(id); return next; });
    setActiveTab(id);
    try { localStorage.setItem('wardrobe_active_tab', id); } catch {}
  };

  const handleTabSwitch = (id) => {
    if (id === activeTab) return;
    switchTab(id);
  };

  const renderContent = () => {
    const tab = (id) => activeTab === id ? 'flex flex-col flex-1 min-h-0' : 'hidden';

    return (
      <div className="relative flex-1 flex flex-col min-h-0">
        {transitioning && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        )}
        <>
          {mountedTabs.has('wardrobe') && (
            <div className={tab('wardrobe')}>
              <WardrobeTab
                items={previewItems}
                boards={isPreview ? BOARDS : boards}
                boardMeta={isPreview ? {} : boardMeta}
                likedItems={likedItems}
                onSelectItem={setSelectedItem}
                onDeleteBoard={handleDeleteBoard}
                onEditBoard={handleEditBoard}
                onDeleteItems={handleDeleteItems}
                onCreateBoard={handleCreateBoard}
                onToggleItemBoard={handleToggleItemBoard}
                onAddItem={() => setAddStep('picker')}
                userId={user?.id}
                isPreview={isPreview}
              />
            </div>
          )}
          {mountedTabs.has('today') && (
            <div className={tab('today')}>
              <TodayTab
                items={readyItems}
                likedItems={likedItems}
                boards={isPreview ? BOARDS : boards}
                onSaveToPublished={isPreview
                  ? collage => { if (collage.items?.length) setPreviewSavedOutfits(prev => [{ ...collage, id: `preview-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                  : handleSaveOutfit}
                onEditInStudio={collage => { setPendingAiCollage(collage); switchTab('studio'); }}
                onLogWorn={handleLogWorn}
                wearLogs={wearLogs}
                isPreview={isPreview}
                userId={user?.id}
                userProfile={profile}
              />
            </div>
          )}
          {mountedTabs.has('studio') && (
            <div className={tab('studio')}>
              <StudioTab
                savedOutfits={savedOutfits}
                draftOutfits={isPreview ? previewDraftOutfits : draftOutfits}
                onSaveOutfit={isPreview
                  ? collage => { if (collage.items?.length) setPreviewSavedOutfits(prev => [{ ...collage, id: `preview-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                  : handleSaveOutfit}
                onSaveDraftOutfit={isPreview
                  ? collage => { if (collage.items?.length) setPreviewDraftOutfits(prev => [{ ...collage, id: `preview-draft-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                  : handleSaveDraftOutfit}
                onUpdateSavedOutfit={isPreview
                  ? (id, collage) => setPreviewSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o))
                  : updateSavedOutfit}
                onUpdateDraftOutfit={isPreview
                  ? (id, collage) => setPreviewDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o))
                  : updateDraftOutfit}
                onRemoveDraftOutfit={isPreview
                  ? id => setPreviewDraftOutfits(prev => prev.filter(o => o.id !== id))
                  : handleRemoveDraftOutfit}
                onRemoveSavedOutfit={isPreview
                  ? id => setPreviewSavedOutfits(prev => prev.filter(o => o.id !== id))
                  : handleRemoveSavedOutfit}
                pendingOutfitItem={pendingOutfitItem}
                pendingTargetCollage={pendingTargetCollage}
                onClearPendingOutfit={() => { setPendingOutfitItem(null); setPendingTargetCollage(null); }}
                pendingAiCollage={pendingAiCollage}
                onClearPendingAiCollage={() => setPendingAiCollage(null)}
                items={readyItems}
                boards={isPreview ? BOARDS : boards}
                outfitBoards={outfitBoards}
                outfitBoardMeta={outfitBoardMeta}
                likedOutfits={likedOutfits}
                onCreateOutfitBoard={handleCreateOutfitBoard}
                onDeleteOutfitBoard={handleDeleteOutfitBoard}
                onEditOutfitBoard={handleEditOutfitBoard}
                onToggleOutfitBoard={handleToggleOutfitBoard}
                onToggleOutfitLike={toggleOutfitLike}
                onLogWorn={handleLogWorn}
                isPreview={isPreview}
                previewCollages={previewCollages}
                userId={user?.id}
              />
            </div>
          )}
          {mountedTabs.has('analytics') && (
            <div className={tab('analytics')}>
              {isPreview
                ? <AnalyticsTab items={ITEMS} wearLogs={DEMO_WEAR_LOGS} onSelectItem={setSelectedItem} onUpdateItem={() => {}} currencySymbol="$" isPreview onSignIn={() => setShowAuthModal(true)} />
                : <AnalyticsTab items={readyItems} wearLogs={wearLogs} onSelectItem={setSelectedItem} onUpdateItem={updateItem} currencySymbol={getCurrencySymbol(profile?.country)} />
              }
            </div>
          )}
          {mountedTabs.has('stylist') && (
            <div className={tab('stylist')}>
              {isPreview
                ? <DemoStylistTab onSignIn={() => setShowAuthModal(true)} />
                : <StylistTab
                    items={readyItems}
                    userId={user?.id}
                    userProfile={profile}
                    onSelectItem={setSelectedItem}
                    onSaveToOutfits={handleSaveOutfit}
                    onOpenInStudio={outfitItems => {
                      setPendingAiCollage({ items: aiOutfitToCanvasItems(outfitItems), canvasWidth: DESIGN_W, canvasHeight: DESIGN_H });
                      switchTab('studio');
                    }}
                  />
              }
            </div>
          )}
          {mountedTabs.has('profile') && !isPreview && (
            <div className={tab('profile')}>
              <ProfileTab
                items={items}
                boards={boards}
                savedOutfits={savedOutfits}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onSignOut={handleSignOut}
                onUpdateAvatar={handleUpdateAvatar}
                onDeleteAccount={handleDeleteAccount}
              />
            </div>
          )}
        </>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const isPreview = !user;
  const previewItems = isPreview ? ITEMS : items;
  const readyItems = isPreview ? ITEMS : items.filter(i => !i._bgRemoving);
  const previewCollages = previewSavedOutfits;

  return (
    <div className="flex h-screen bg-white overflow-hidden antialiased font-sans">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 xl:w-64 border-r border-gray-100 py-8 px-4 flex-shrink-0 bg-white">

        <div className="px-3 mb-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">
            est. 2026
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your digital wardrobe</p>
        </div>

        <nav className="flex flex-col gap-1">
          {TABS.map(({ id, label, Icon }) => {
            if (isPreview && id === 'profile') return null;
            const active = activeTab === id;
            const displayLabel = id === 'today'
              ? `Today, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : label;
            return (
              <button
                key={id}
                onClick={() => handleTabSwitch(id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
                {displayLabel}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          {isPreview ? (
            <div className="px-3 pb-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                <User size={15} strokeWidth={2} />
                Sign in / Sign up
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2 leading-snug">Sign in to save your wardrobe and outfits</p>
            </div>
          ) : (
            <button
              onClick={() => handleTabSwitch('profile')}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors group ${
                activeTab === 'profile' ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 flex-shrink-0 shadow-sm overflow-hidden">
                {profile.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-400">View profile</p>
              </div>
              <ChevronRight size={13} className="text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <div className="md:hidden flex items-center justify-between px-5 pt-14 pb-3 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          </div>
          <div className="flex items-center gap-2">
            {isPreview ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
              >
                <User size={12} strokeWidth={2} />
                Sign in
              </button>
            ) : (
              <button onClick={() => handleTabSwitch('profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-sm overflow-hidden flex-shrink-0">
                {profile.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
              </button>
            )}
          </div>
        </div>

        {renderContent()}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        <div className="flex items-center justify-around px-2 pt-2 pb-6">
          {TABS.map(({ id, label, Icon }) => {
            if (isPreview && id === 'profile') return null;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabSwitch(id)}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div className={`w-12 h-7 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-gray-900' : ''}`}>
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.75} className={active ? 'text-white' : 'text-gray-400'} />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Item detail modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          liked={likedItems.has(selectedItem.id)}
          onToggleLike={toggleLike}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onUpdateImage={updateItemImage}
          onAddToOutfit={handleAddToOutfit}
          onOpenCollage={handleOpenExistingCollage}
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          boards={boards}
          onToggleBoard={handleToggleItemBoard}
          isPreview={isPreview}
          currencySymbol={getCurrencySymbol(profile.country)}
        />
      )}

      {addStep === 'picker' && (
        <AddMethodModal
          onClose={() => setAddStep(null)}
          onImageSelected={(file, bgPromise) => {
            setAddItemFile(file);
            setAddItemProcessing(bgPromise);
            setAddStep('form');
          }}
          onLinkSelected={() => setAddStep('link')}
        />
      )}

      {addStep === 'link' && (
        <AddFromLinkModal
          onClose={() => { setAddStep(null); setAddLinkScraped(null); }}
          onBack={() => setAddStep('picker')}
          onScraped={setAddLinkScraped}
          initialStep={addLinkScraped ? 'images' : 'url'}
          initialScraped={addLinkScraped}
          onImageSelected={(file, bgPromise, prefill) => {
            setAddItemFile(file);
            setAddItemProcessing(bgPromise);
            setAddItemPrefill(prefill);
            setAddStep('form');
          }}
        />
      )}

      {addStep === 'form' && (
        <AddItemModal
          onClose={() => { setAddStep(null); setAddItemFile(null); setAddItemProcessing(null); setAddItemPrefill(null); setAddLinkScraped(null); }}
          onBack={() => {
            if (addLinkScraped) {
              setAddStep('link');
            } else {
              setAddItemFile(null);
              setAddItemProcessing(null);
              setAddStep('picker');
            }
            setAddItemPrefill(null);
          }}
          onAdd={addItem}
          initialImage={addItemFile}
          imageProcessingPromise={addItemProcessing}
          initialForm={addItemPrefill}
          currencySymbol={getCurrencySymbol(profile.country)}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showOnboarding && user && (
        <OnboardingModal onComplete={handleCompleteOnboarding} />
      )}
    </div>
  );
}
