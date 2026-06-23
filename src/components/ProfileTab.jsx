import React, { useState, useEffect, useRef } from 'react';
import { Pencil, User, Camera, Loader2, LogOut, Trash2, ChevronRight, MapPin } from 'lucide-react';
import { OUTFIT_GOALS, COUNTRIES } from '../lib/constants.js';

const STYLE_OPTIONS = [
  { id: 'feminine', label: 'Feminine', emoji: '🌸' },
  { id: 'masculine', label: 'Masculine', emoji: '🧥' },
  { id: 'neutral', label: 'Neutral', emoji: '⚡' },
];

export function ProfileTab({ items, boards, savedOutfits, profile, onUpdateProfile, onSignOut, onUpdateAvatar, onDeleteAccount }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(profile);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile]);

  const stats = [
    { label: 'Items',   value: items.length },
    { label: 'Boards',  value: boards.filter(b => b !== 'All').length },
    { label: 'Outfits', value: savedOutfits.length },
  ];

  const toggleOutfitGoal = id => {
    setDraft(d => ({
      ...d,
      outfitGoals: d.outfitGoals.includes(id)
        ? d.outfitGoals.filter(g => g !== id)
        : [...d.outfitGoals, id],
    }));
  };

  const handleSave = () => {
    const VALID_GOAL_IDS = new Set(OUTFIT_GOALS.map(g => g.id));
    const VALID_STYLE_IDS = new Set(STYLE_OPTIONS.map(s => s.id));
    onUpdateProfile({
      ...draft,
      name: draft.name.trim().slice(0, 60),
      bio: draft.bio.trim().slice(0, 160),
      topSize: (draft.topSize ?? '').trim().slice(0, 20),
      bottomSize: (draft.bottomSize ?? '').trim().slice(0, 20),
      shoeSize: (draft.shoeSize ?? '').trim().slice(0, 20),
      outfitGoals: (draft.outfitGoals ?? []).filter(id => VALID_GOAL_IDS.has(id)),
      stylePreference: VALID_STYLE_IDS.has(draft.stylePreference) ? draft.stylePreference : '',
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 pt-8 pb-32 md:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Profile</h2>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full hover:border-gray-400 transition-all"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>

        {/* Avatar + name + bio */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-md flex items-center justify-center overflow-hidden cursor-pointer relative"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                !profile.name && <User size={28} className="text-white/80" />
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarUploading(true);
                await onUpdateAvatar(file);
                setAvatarUploading(false);
                e.target.value = '';
              }}
            />
          </div>

          {editing ? (
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="Your name"
              maxLength={60}
              className="text-xl font-bold text-gray-900 text-center bg-transparent border-b-2 border-gray-300 focus:border-gray-900 outline-none pb-0.5 mb-2 w-48"
            />
          ) : (
            <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name || 'Add your name'}</h3>
          )}

          {editing ? (
            <textarea
              value={draft.bio}
              onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
              placeholder="Add a short bio…"
              maxLength={160}
              rows={2}
              className="text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 resize-none w-full max-w-xs mt-1"
            />
          ) : (
            <p className="text-sm text-gray-400 text-center mt-0.5">
              {profile.bio || 'Look at my outfits!'}
            </p>
          )}

          {/* Country */}
          {editing ? (
            <select
              value={draft.country}
              onChange={e => setDraft(d => ({ ...d, country: e.target.value }))}
              className="mt-3 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-transparent focus:border-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">Country not set</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : profile.country ? (
            <div className="flex items-center gap-1 mt-2">
              <MapPin size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">{profile.country}</span>
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex gap-0 justify-center mb-8 py-5 border-y border-gray-100">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center flex-1 ${i > 0 ? 'border-l border-gray-100' : ''}`}>
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Style preference */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Style direction</h4>
          <div className="grid grid-cols-3 gap-2">
            {STYLE_OPTIONS.map(({ id, label, emoji }) => {
              const active = editing ? draft.stylePreference === id : profile.stylePreference === id;
              return (
                <button
                  key={id}
                  onClick={() => editing && setDraft(d => ({ ...d, stylePreference: d.stylePreference === id ? '' : id }))}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : editing
                        ? 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
          {!editing && !profile.stylePreference && (
            <p className="text-sm text-gray-300 mt-2">Tap Edit to set your style direction</p>
          )}
        </section>

        {/* Outfit goals */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">What I'm looking to create</h4>
          <div className="grid grid-cols-2 gap-2">
            {OUTFIT_GOALS.map(({ id, label, emoji }) => {
              const active = editing ? draft.outfitGoals?.includes(id) : profile.outfitGoals?.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => editing && toggleOutfitGoal(id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : editing
                        ? 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="leading-snug text-left">{label}</span>
                </button>
              );
            })}
          </div>
          {!editing && (!profile.outfitGoals || profile.outfitGoals.length === 0) && (
            <p className="text-sm text-gray-300 mt-2">Tap Edit to set your outfit goals</p>
          )}
        </section>

        {/* Settings */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Settings</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-700">Privacy</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors group mt-2"
            >
              <LogOut size={15} className="text-red-400 group-hover:text-red-500" />
              <p className="text-sm font-medium text-red-400 group-hover:text-red-500">Sign out</p>
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors group"
              >
                <Trash2 size={15} className="text-red-300 group-hover:text-red-400" />
                <p className="text-sm font-medium text-red-300 group-hover:text-red-400">Delete account</p>
              </button>
            ) : (
              <div className="px-4 py-4 rounded-xl bg-red-50 border border-red-100 mt-1">
                <p className="text-sm font-medium text-red-700 mb-1">Delete your account?</p>
                <p className="text-xs text-red-400 mb-3 leading-relaxed">This will permanently delete all your wardrobe data. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDeleteAccount}
                    className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
