import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check, Sparkles } from 'lucide-react';
import { supabase } from '../../supabase.js';

export function AuthModal({ onClose, recoveryMode = false }) {
  const [mode, setMode]         = useState(recoveryMode ? 'recovery' : 'signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [verified, setVerified] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { onboarding_complete: false, name: name.trim() } },
        });
        if (err) throw err;
        setVerified(true);

      } else if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onClose?.();

      } else if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setResetSent(true);

      } else if (mode === 'recovery') {
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        onClose?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = key => { setMode(key); setError(''); setPassword(''); setConfirmPassword(''); setResetSent(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-fade" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-sm modal-animate">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">est. 2026</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Vêtu</h1>
          <p className="text-sm text-gray-300 mt-1">Your digital wardrobe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-8 pt-12 pb-8 relative">
          {onClose && !recoveryMode && (
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <X size={18} strokeWidth={2} />
            </button>
          )}

          {/* Email verified after sign-up */}
          {verified ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                We sent a confirmation link to <span className="font-medium text-gray-700">{email}</span>. Open it to activate your account, then come back and sign in.
              </p>
              <button
                onClick={() => { setVerified(false); switchMode('signin'); setName(''); }}
                className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Back to sign in
              </button>
            </div>

          /* Reset link sent */
          ) : resetSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>. Click it to set a new password.
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Back to sign in
              </button>
            </div>

          ) : (
            <>
              {/* Mode toggle — only for signin/signup */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  {[{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Sign Up' }].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => switchMode(key)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Forgot password heading */}
              {mode === 'forgot' && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Reset password</h3>
                  <p className="text-sm text-gray-400 mt-1">Enter your email and we'll send a reset link.</p>
                </div>
              )}

              {/* Recovery heading */}
              {mode === 'recovery' && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Set new password</h3>
                  <p className="text-sm text-gray-400 mt-1">Choose a new password for your account.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                )}

                {/* Email — shown on signin, signup, forgot */}
                {mode !== 'recovery' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                )}

                {/* Password — shown on signin, signup, recovery */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-600">
                        {mode === 'recovery' ? 'New password' : 'Password'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={mode === 'recovery' ? 8 : 6}
                        className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm password — signup and recovery */}
                {(mode === 'signup' || mode === 'recovery') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {mode === 'recovery' ? 'Confirm new password' : 'Retype password'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={mode === 'recovery' ? 8 : 6}
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-gray-200 focus:border-gray-400'
                      }`}
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {mode === 'signup'    ? 'Create account'
                  : mode === 'forgot'  ? 'Send reset link'
                  : mode === 'recovery'? 'Update password'
                  :                      'Sign in'}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Back to sign in
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
