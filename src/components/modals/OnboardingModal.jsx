import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { OUTFIT_GOALS, COUNTRIES } from '../../lib/constants.js';

export function OnboardingModal({ onComplete }) {
  const [slide, setSlide]     = useState(0);
  const [bio, setBio]         = useState('');
  const [country, setCountry] = useState('');
  const [outfitGoals, setOutfitGoals] = useState([]);

  const TOTAL = 3;

  const toggleOutfitGoal = (id) => {
    setOutfitGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleFinish = () => {
    onComplete({ bio: bio.trim(), country, outfitGoals });
  };

  const canAdvance = slide !== 1 || country.trim();

  const slides = [
    /* Slide 0 — Welcome */
    <div key="welcome" className="flex flex-col items-center text-center px-2 py-6">
      <div className="w-16 h-16 bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 rounded-full flex items-center justify-center mb-5 shadow-md">
        <Sparkles size={26} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Vêtu</h2>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
        Let's spend one minute personalising your experience so we can help you look your best, every day.
      </p>
    </div>,

    /* Slide 1 — Profile info */
    <div key="profile" className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Your profile</h3>
        <p className="text-xs text-gray-400">Country is required. Bio is optional.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="A short note about your style…"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Country <span className="text-rose-400">*</span>
        </label>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors bg-white appearance-none cursor-pointer"
        >
          <option value="" disabled>Select your country…</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>,

    /* Slide 2 — Outfit goals */
    <div key="goals" className="py-2">
      <h3 className="text-lg font-bold text-gray-900 mb-1">What kind of outfits are you looking to create?</h3>
      <p className="text-xs text-gray-400 mb-5">Select all that apply — or skip.</p>
      <div className="grid grid-cols-2 gap-3">
        {OUTFIT_GOALS.map(({ id, label, emoji }) => {
          const selected = outfitGoals.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleOutfitGoal(id)}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                selected
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-center leading-snug">{label}</span>
            </button>
          );
        })}
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-fade">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden modal-animate">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-500"
            style={{ width: `${((slide + 1) / TOTAL) * 100}%` }}
          />
        </div>

        <div className="px-8 pt-8 pb-6 min-h-[420px] flex flex-col">
          <div className="flex-1">
            {slides[slide]}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-6">
            {slide > 0 && (
              <button
                onClick={() => setSlide(s => s - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
              >
                Back
              </button>
            )}
            {slide < TOTAL - 1 ? (
              <button
                onClick={() => canAdvance && setSlide(s => s + 1)}
                disabled={!canAdvance}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  canAdvance
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {slide === 0 ? "Let's go" : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>

          {/* Skip on non-required slides */}
          {slide > 1 && (
            <button
              onClick={() => slide === TOTAL - 1 ? handleFinish() : setSlide(s => s + 1)}
              className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
