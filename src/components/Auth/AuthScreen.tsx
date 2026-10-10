/**
 * AuthScreen.tsx
 * ──────────────
 * Full-screen auth flow shown when no Supabase session exists.
 * Tabs: Sign In | Create Account | Continue as Guest (with name)
 *
 * Design: warm parchment + forest green — matches Waypost brand exactly.
 */
import React, { useState, useRef } from 'react';
import { MapPin, Eye, EyeOff, ArrowRight, Compass, Leaf, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ── Avatar presets ──
const AVATAR_PRESETS = ['🌿', '🧭', '☕', '🌊', '🍃', '🌄', '✨', '🦋', '🌸', '🪶', '🌲', '🗺️'];

type Tab = 'login' | 'signup' | 'guest';

export const AuthScreen: React.FC = () => {
  const { login, signup, enterAsGuest } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupAvatar, setSignupAvatar] = useState('🌿');
  const [signupBio, setSignupBio] = useState('');

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('🌲');

  const clearError = () => setError('');

  // ── Submit handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    setIsLoading(true);
    setError('');
    const res = await login(loginEmail.trim(), loginPassword);
    setIsLoading(false);
    if (!res.success) setError(res.error ?? 'Login failed.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) { setError('Please enter a display name.'); return; }
    if (!signupEmail.trim() || !signupEmail.includes('@')) { setError('Enter a valid email address.'); return; }
    if (signupPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (signupPassword !== signupConfirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    setError('');
    const res = await signup({
      displayName: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      avatarPreset: signupAvatar,
      bio: signupBio.trim() || undefined,
    });
    setIsLoading(false);
    if (!res.success) setError(res.error ?? 'Signup failed.');
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const name = guestName.trim() || 'Wanderer';
    const res = await enterAsGuest(name);
    setIsLoading(false);
    if (!res.success) setError(res.error ?? 'Could not start guest session.');
  };

  return (
    <div className="min-h-screen bg-[#F4F0E5] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#18392D]/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#18392D]/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#E8E3D5]/40 blur-2xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm z-10">

        {/* Brand header */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#18392D] shadow-lg mb-4">
            <MapPin className="w-8 h-8 text-[#FAF8F3]" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-[#18392D] tracking-tight leading-none mb-1">
            Waypost
          </h1>
          <p className="text-sm text-[#73776F] font-medium italic">Little notes. Long journeys.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#E8E3D5] rounded-2xl p-1 mb-5">
          {([
            { id: 'login', label: 'Sign In' },
            { id: 'signup', label: 'Create Account' },
            { id: 'guest', label: 'Guest' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); clearError(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                tab === t.id
                  ? 'bg-[#FAF8F3] text-[#18392D] shadow-sm'
                  : 'text-[#73776F] hover:text-[#18392D]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-slide-up">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── LOGIN TAB ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="bg-white/70 backdrop-blur-sm border border-[#DED8C7] rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => { setLoginEmail(e.target.value); clearError(); }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 focus:border-[#18392D]/40 transition placeholder:text-[#ADB5AD]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); clearError(); }}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 focus:border-[#18392D]/40 transition placeholder:text-[#ADB5AD]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73776F] hover:text-[#18392D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading || !loginEmail || !loginPassword}
              className="w-full py-3 rounded-xl bg-[#18392D] hover:bg-[#122b22] text-[#FAF8F3] text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><ArrowRight className="w-4 h-4" /> Sign In</>
              )}
            </button>
            <p className="text-center text-xs text-[#73776F]">
              No account?{' '}
              <button type="button" onClick={() => { setTab('signup'); clearError(); }}
                className="text-[#18392D] font-semibold underline underline-offset-2">
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── SIGNUP TAB ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="bg-white/70 backdrop-blur-sm border border-[#DED8C7] rounded-2xl p-6 shadow-lg space-y-3.5">
            {/* Avatar picker */}
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-2 block">Pick your avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSignupAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border-2 ${
                      signupAvatar === emoji
                        ? 'border-[#18392D] bg-[#18392D]/10 scale-110'
                        : 'border-transparent bg-[#F4F0E5] hover:border-[#C8D3C5]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Display name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="How travellers will know you"
                maxLength={50}
                value={signupName}
                onChange={(e) => { setSignupName(e.target.value); clearError(); }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(e) => { setSignupEmail(e.target.value); clearError(); }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={signupPassword}
                  onChange={(e) => { setSignupPassword(e.target.value); clearError(); }}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73776F] hover:text-[#18392D]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Confirm password</label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={signupConfirm}
                  onChange={(e) => { setSignupConfirm(e.target.value); clearError(); }}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73776F] hover:text-[#18392D]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">Short bio <span className="font-normal text-[#ADB5AD]">(optional)</span></label>
              <input
                id="signup-bio"
                type="text"
                placeholder="A sentence about you..."
                maxLength={100}
                value={signupBio}
                onChange={(e) => setSignupBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
              />
            </div>
            <button
              id="btn-signup"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#18392D] hover:bg-[#122b22] text-[#FAF8F3] text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
            >
              {isLoading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Create Account</>
              }
            </button>
            <p className="text-center text-xs text-[#73776F]">
              Already have an account?{' '}
              <button type="button" onClick={() => { setTab('login'); clearError(); }}
                className="text-[#18392D] font-semibold underline underline-offset-2">
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* ── GUEST TAB ── */}
        {tab === 'guest' && (
          <form onSubmit={handleGuest} className="bg-white/70 backdrop-blur-sm border border-[#DED8C7] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="text-center pb-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F4F0E5] border border-[#DED8C7] flex items-center justify-center text-2xl mb-2">
                {guestAvatar}
              </div>
              <p className="text-sm font-semibold text-[#18392D]">Explore without an account</p>
              <p className="text-xs text-[#73776F] mt-0.5 leading-relaxed">
                Browse notes and leave your own.<br />
                Your notes sync to this device only.
              </p>
            </div>

            {/* Guest avatar picker */}
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-2 block">Choose a traveller icon</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGuestAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border-2 ${
                      guestAvatar === emoji
                        ? 'border-[#18392D] bg-[#18392D]/10 scale-110'
                        : 'border-transparent bg-[#F4F0E5] hover:border-[#C8D3C5]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest name */}
            <div>
              <label className="text-xs font-semibold text-[#4B5563] mb-1.5 block">
                Your name <span className="font-normal text-[#ADB5AD]">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#ADB5AD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="guest-name"
                  type="text"
                  placeholder="Wanderer"
                  maxLength={40}
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); clearError(); }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] text-sm text-[#242923] focus:outline-none focus:ring-2 focus:ring-[#18392D]/30 transition placeholder:text-[#ADB5AD]"
                />
              </div>
            </div>

            <button
              id="btn-guest"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#4B7A5A] hover:bg-[#3d6449] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
            >
              {isLoading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Compass className="w-4 h-4" /> Start Exploring</>
              }
            </button>
            <p className="text-center text-xs text-[#73776F]">
              Want to sync across devices?{' '}
              <button type="button" onClick={() => { setTab('signup'); clearError(); }}
                className="text-[#18392D] font-semibold underline underline-offset-2">
                Create a free account
              </button>
            </p>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-[#ADB5AD] mt-6 flex items-center justify-center gap-1">
          <Leaf className="w-3 h-3" />
          Notes exist in places. Be present.
        </p>
      </div>
    </div>
  );
};
