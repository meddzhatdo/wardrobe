import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, PlusCircle, MessageSquare, X, Send,
  Pencil, Copy, Check, Loader2, Trash2, Bookmark,
} from 'lucide-react';
import { DESIGN_W, DESIGN_H, aiOutfitToCanvasItems, OutfitCollage } from '../lib/collage.jsx';
import { supabase } from '../supabase.js';

const WARDROBE_AWARE_RE = /\b(my\s+(wardrobe|closet|clothes|items?|pieces?|collection)|what\s+(do\s+i\s+(have|own)|gaps?|i\s+have)|outfit\s+(for|from|with)|make\s+me\s+an\s+outfit|build\s+(me\s+)?an?\s+outfit|suggest\s+(an?\s+)?outfit|style\s+me|capsule\s+wardrobe|what\s+should\s+i\s+wear|what\s+can\s+i\s+wear|what\s+goes\s+with|collage)\b/i;
const COLLAGE_REQUEST_RE = /\b(collage|make\s+(?:me\s+)?(?:an?\s+)?(?:outfit|look)|build\s+(?:me\s+)?(?:an?\s+)?(?:outfit|look)|create\s+(?:an?\s+)?(?:outfit|look|collage)|put\s+together\s+(?:an?\s+)?(?:outfit|look)|suggest\s+(?:an?\s+)?outfit|show\s+me\s+(?:an?\s+)?outfit|give\s+me\s+(?:an?\s+)?outfit|generate\s+(?:an?\s+)?outfit|style\s+(?:me\s+)?(?:an?\s+)?outfit)\b/i;

function formatConvoDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DEMO_STYLIST_MESSAGES = [
  { role: 'user',      content: 'What should I wear to a dinner date this weekend?' },
  { role: 'assistant', content: 'For a dinner date, your **Bow Mini Dress** by Valentino Garavani is the clear choice — that vivid red makes an unforgettable entrance. Ground it with the **Crystal-Heel Mary Janes** from Miu Miu for an editorial edge that still feels wearable. Keep accessories minimal: the **Ava Top-Handle Bag** from Teddy Blake adds structure without competing with the dress. If the evening runs cool, the **Camellia Leather Jacket** draped over your shoulders adds the perfect contrast.' },
  { role: 'user',      content: 'What about something more casual but still put-together?' },
  { role: 'assistant', content: 'A great effortless option: your **Cashmere Turtleneck** in ivory with the **High-Rise Flare Pant** in black. The proportions are classic and the tonal contrast keeps it polished. Slip on the **Super-Star Sneakers** from Golden Goose for that nonchalant edge, then finish with the **Icon Watch** and **Chanel Sunglasses**. It reads very considered without looking like you tried.' },
];

function findReferencedItems(text, items) {
  if (!items?.length || !text) return [];
  const lower = text.toLowerCase();
  return items.filter(item => item.name && item.name.length >= 3 && lower.includes(item.name.toLowerCase()));
}

function StylistItemChip({ item, onSelect }) {
  return (
    <button onClick={() => onSelect(item)} className="flex flex-col items-center gap-1 text-left flex-shrink-0 w-[88px]">
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors">
        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />}
      </div>
      <p className="text-[10px] text-gray-400 text-center leading-tight w-full truncate">{item.name || item.category}</p>
    </button>
  );
}

const COLLAGE_MINI_SCALE = 0.32;

function StylistMiniCollage({ outfit, items, onOpenInStudio, onSaveToOutfits }) {
  const [saveState, setSaveState] = useState('idle');

  const outfitItems = (outfit.itemIds ?? [])
    .map(id => items.find(i => String(i.id) === String(id)))
    .filter(Boolean);
  if (!outfitItems.length) return null;

  const displayW = Math.round(Math.round(DESIGN_H * COLLAGE_MINI_SCALE) * 210 / 297);

  const handleSave = async () => {
    if (saveState !== 'idle' || !onSaveToOutfits) return;
    setSaveState('saving');
    await onSaveToOutfits({
      name: outfit.outfitName,
      items: aiOutfitToCanvasItems(outfitItems),
      bgColor: '#FFFFFF',
      canvasWidth: DESIGN_W,
      canvasHeight: DESIGN_H,
      thumbnail: '',
    });
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2800);
  };

  return (
    <div className="ml-11 mb-4">
      <div className="inline-block bg-white border border-gray-100 rounded-2xl shadow-sm">
        <OutfitCollage items={outfitItems} fixedScale={COLLAGE_MINI_SCALE} />
        <div className="px-3 py-2.5 flex items-center justify-between" style={{ width: displayW }}>
          <p className="text-[11px] font-semibold text-gray-800 truncate min-w-0">{outfit.outfitName}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {onSaveToOutfits && (
              <div className="relative group/save">
                <button
                  onClick={handleSave}
                  disabled={saveState !== 'idle'}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors
                    ${saveState === 'saved'
                      ? 'border-green-200 bg-green-50 text-green-500'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                >
                  {saveState === 'saved' ? <Check size={13} strokeWidth={2.5} /> : <Bookmark size={13} strokeWidth={1.8} />}
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover/save:opacity-100 transition-opacity z-10">
                  {saveState === 'saved' ? 'Saved!' : 'Save to Outfits'}
                </span>
              </div>
            )}
            {onOpenInStudio && (
              <div className="relative group/edit">
                <button
                  onClick={() => onOpenInStudio(outfitItems)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity z-10">
                  Edit Outfit
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_CONVERSATIONS = [
  { id: 'demo-1', title: 'Date night outfit ideas',   updated_at: new Date(Date.now() - 1  * 86400000).toISOString() },
  { id: 'demo-2', title: 'Spring capsule wardrobe',   updated_at: new Date(Date.now() - 4  * 86400000).toISOString() },
  { id: 'demo-3', title: 'What to pack for Paris',    updated_at: new Date(Date.now() - 9  * 86400000).toISOString() },
];

export function DemoStylistTab({ onSignIn }) {
  return (
    <div className="flex h-full overflow-hidden relative">

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        <div className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Stylist</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your personal style advisor</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed select-none">
              <PlusCircle size={13} />
              New
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-10 pb-4">
          {DEMO_STYLIST_MESSAGES.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-emerald-500" />
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-sm ${
                  isUser
                    ? 'bg-gray-900 text-white rounded-tr-sm whitespace-pre-wrap'
                    : 'bg-gray-100 text-gray-700 rounded-tl-sm'
                }`}>
                  {isUser ? msg.content : (
                    <ReactMarkdown
                      components={{
                        p:      ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 md:px-10 pb-28 md:pb-8 flex-shrink-0">
          <div className="rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 flex flex-col items-center gap-3 text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <Sparkles size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Chat with your AI Stylist</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug max-w-[220px] mx-auto">
                Sign in to get personalized outfit advice based on your real wardrobe.
              </p>
            </div>
            <button
              onClick={onSignIn}
              className="px-5 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
            >
              Sign in to start chatting
            </button>
          </div>
        </div>
      </div>

      {/* History sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 border-l border-gray-100 h-full">
        <div className="px-4 pt-8 pb-3 flex-shrink-0 flex items-center border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">History</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {DEMO_CONVERSATIONS.map((convo, i) => (
            <div
              key={convo.id}
              className={`flex items-start gap-2 px-4 py-3 ${i === 0 ? 'bg-gray-50' : ''}`}
            >
              <MessageSquare size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate leading-snug">{convo.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatConvoDate(convo.updated_at)}</p>
              </div>
            </div>
          ))}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={onSignIn}
              className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors text-center"
            >
              Sign in to see your history →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StylistTab({ items = [], userId = null, userProfile = {}, onSelectItem, onOpenInStudio, onSaveToOutfits }) {
  const SUGGESTIONS = [
    "What's trending this season?",
    'What gaps are there in my closet?',
    'How do I develop my personal style?',
  ];

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [editingIdx, setEditingIdx]       = useState(null);
  const [editDraft, setEditDraft]         = useState('');
  const [copiedIdx, setCopiedIdx]         = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    if (!userId) { setLoadingHistory(false); return; }
    supabase
      .from('stylist_conversations')
      .select('id, title, messages, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setConversations(data);
          try {
            const savedId = localStorage.getItem(`wardrobe_stylist_active_id_${userId}`);
            if (savedId) {
              const match = data.find(c => c.id === savedId);
              if (match) { setActiveId(match.id); setMessages(match.messages ?? []); }
            }
          } catch {}
        }
        setLoadingHistory(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const key = `wardrobe_stylist_active_id_${userId}`;
      if (activeId) localStorage.setItem(key, activeId);
      else localStorage.removeItem(key);
    } catch {}
  }, [activeId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewConversation = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const loadConversation = (convo) => {
    setActiveId(convo.id);
    setMessages(convo.messages ?? []);
    setError(null);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    await supabase.from('stylist_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const sendMessage = async (text = input.trim(), baseMessages = messages) => {
    if (!text || sending) return;
    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...baseMessages, userMsg];
    setMessages(nextMessages);
    setSending(true);

    const isCollageRequest = COLLAGE_REQUEST_RE.test(text);
    const needsWardrobe = isCollageRequest || WARDROBE_AWARE_RE.test(text);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai-stylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: nextMessages,
          includeWardrobe: needsWardrobe,
          includeCollage: isCollageRequest,
          items: needsWardrobe ? items : [],
          userProfile,
        }),
      });

      let json;
      try { json = await res.json(); } catch { throw new Error('Server error. Please try again.'); }
      if (!res.ok) {
        if (json.error === 'collage_limit') {
          const when = json.resetsAt
            ? `${json.message} Next available at ${new Date(json.resetsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
            : json.message;
          throw new Error(when);
        }
        throw new Error(json.error || 'Request failed');
      }

      const assistantMsg = {
        role: 'assistant',
        content: json.reply,
        referencedItemIds: json.referencedItemIds ?? [],
        outfit: json.outfit ?? null,
      };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      const title = text.slice(0, 60);
      if (activeId) {
        await supabase.from('stylist_conversations')
          .update({ messages: finalMessages, updated_at: new Date().toISOString() })
          .eq('id', activeId);
        setConversations(prev => prev.map(c =>
          c.id === activeId ? { ...c, messages: finalMessages, updated_at: new Date().toISOString() } : c
        ));
      } else {
        const { data } = await supabase.from('stylist_conversations')
          .insert({ user_id: userId, title, messages: finalMessages })
          .select('id, title, messages, updated_at')
          .single();
        if (data) {
          setActiveId(data.id);
          setConversations(prev => [data, ...prev]);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setMessages(nextMessages);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyMessage = (idx, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const startEdit = (idx, content) => { setEditingIdx(idx); setEditDraft(content); };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft(''); };

  const submitEdit = (idx) => {
    const text = editDraft.trim();
    if (!text || sending) return;
    setEditingIdx(null);
    setEditDraft('');
    sendMessage(text, messages.slice(0, idx));
  };

  const isNew = messages.length === 0;

  return (
    <div className="flex h-full overflow-hidden relative">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        <div className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Stylist</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your personal style advisor</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <PlusCircle size={13} />
              New
            </button>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0 md:hidden"
            >
              <MessageSquare size={13} />
              History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-10 pb-4">

          {isNew && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-emerald-500" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Hi! I'm your personal stylist. Ask me anything — from outfit ideas to what's trending.
                  </p>
                </div>
              </div>
              <div className="ml-11 space-y-2 mb-6">
                {SUGGESTIONS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="block text-left w-full px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isEditing = isUser && editingIdx === i;
            const hasCollage = !isUser && msg.outfit?.itemIds?.length > 0;
            const referenced = !isUser && !hasCollage && onSelectItem
              ? (Array.isArray(msg.referencedItemIds)
                  ? items.filter(it => msg.referencedItemIds.includes(String(it.id)))
                  : findReferencedItems(msg.content, items))
              : [];
            const hasBelow = hasCollage || referenced.length > 0;
            return (
              <React.Fragment key={i}>
                <div className={`flex gap-3 ${isUser ? 'justify-end' : ''} ${hasBelow && !isEditing ? 'mb-1.5' : 'mb-4'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-emerald-500" />
                    </div>
                  )}
                  {isEditing ? (
                    <div className="flex flex-col gap-2 max-w-sm w-full">
                      <textarea
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(i); }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onFocus={e => { const len = e.target.value.length; e.target.setSelectionRange(len, len); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                        autoFocus
                        rows={1}
                        className="w-full px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-gray-900 text-white resize-none outline-none scrollbar-hide"
                        style={{ minHeight: '44px' }}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitEdit(i)}
                          disabled={!editDraft.trim()}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`group relative ${isUser ? 'flex flex-col items-end' : ''}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-sm ${
                          isUser
                            ? 'bg-gray-900 text-white rounded-tr-sm whitespace-pre-wrap'
                            : 'bg-gray-100 text-gray-700 rounded-tl-sm'
                        }`}
                      >
                        {isUser ? msg.content : (
                          <ReactMarkdown
                            components={{
                              p:      ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                              ul:     ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
                              ol:     ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
                              li:     ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                      {isUser && !sending && editingIdx === null && (
                        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <div className="relative group/copy">
                            <button
                              onClick={() => copyMessage(i, msg.content)}
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              {copiedIdx === i ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-800 text-white whitespace-nowrap opacity-0 group-hover/copy:opacity-100 transition-opacity z-10">
                              {copiedIdx === i ? 'Copied!' : 'Copy message'}
                            </span>
                          </div>
                          <div className="relative group/edit">
                            <button
                              onClick={() => startEdit(i, msg.content)}
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-800 text-white whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity z-10">
                              Edit message
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {hasCollage && (
                  <StylistMiniCollage
                    outfit={msg.outfit}
                    items={items}
                    onOpenInStudio={onOpenInStudio}
                    onSaveToOutfits={onSaveToOutfits}
                  />
                )}
                {referenced.length > 0 && (
                  <div className="ml-11 mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {referenced.map(item => (
                      <StylistItemChip key={item.id} item={item} onSelect={onSelectItem} />
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {sending && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={14} className="text-emerald-500" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 ml-11 mb-4">{error}</p>}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 md:px-10 pb-28 md:pb-8 flex-shrink-0">
          <div className="flex items-end gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your stylist anything…"
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 resize-none outline-none leading-relaxed max-h-32 scrollbar-hide"
              style={{ minHeight: '20px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity mb-0.5"
            >
              <Send size={12} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* History sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-100 z-30 flex flex-col
        transition-transform duration-300
        md:relative md:translate-x-0 md:z-auto md:w-64 md:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="px-4 pt-8 pb-3 flex-shrink-0 flex items-center justify-between border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">History</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-full hover:bg-gray-100">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {loadingHistory && (
            <div className="flex justify-center pt-8">
              <Loader2 size={18} className="text-gray-300 animate-spin" />
            </div>
          )}
          {!loadingHistory && conversations.length === 0 && (
            <p className="text-xs text-gray-400 text-center pt-8 px-4">No conversations yet</p>
          )}
          {conversations.map(convo => (
            <div
              key={convo.id}
              onClick={() => loadConversation(convo)}
              className={`group relative flex items-start gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeId === convo.id ? 'bg-gray-50' : ''
              }`}
            >
              <MessageSquare size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate leading-snug">{convo.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatConvoDate(convo.updated_at)}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(convo.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all flex-shrink-0"
              >
                <Trash2 size={12} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
