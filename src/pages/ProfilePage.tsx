import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Edit3,
  Bookmark,
  Compass,
  LogOut,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { useLocation } from '../context/LocationContext';
import { NoteCard } from '../components/Notes/NoteCard';
import { NoteDetailModal } from '../components/Notes/NoteDetailModal';
import { WaypostNote } from '../types';

const AVATAR_PRESETS = ['🌿', '🌲', '🌸', '☕', '🧭', '🏕️', '🍂', '✨', '🐾', '🌊'];

export const ProfilePage: React.FC = () => {
  const { user, isGuest, login, signup, logout, updateProfile, accounts, switchAccount } = useAuth();
  const { coordinates } = useLocation();
  const { selectedNote, isDetailOpen, openNoteDetail, closeNoteDetail, notes, isBookmarked } = useNotes();

  const [createdNotes, setCreatedNotes] = useState<WaypostNote[]>([]);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('🌿');

  // Auth Modal/Tab state for guests
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const loadUserData = () => {
    if (user) {
      setCreatedNotes(notes.filter((note) => note.authorId === user.id));
      setSavedCount(notes.filter((note) => isBookmarked(note.id)).length);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id, isDetailOpen, notes, isBookmarked]);

  const handleStartEdit = () => {
    setEditName(user?.displayName || '');
    setEditBio(user?.bio || '');
    setEditAvatar(user?.avatarPreset || '🌿');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: editName.trim() || user?.displayName,
      bio: editBio.trim() || undefined,
      avatarPreset: editAvatar,
    });
    setIsEditingProfile(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
      const res = await signup({
        displayName,
        email,
        password,
        avatarPreset: editAvatar,
      });
      if (!res.success) {
        setAuthError(res.error || 'Signup failed.');
      } else {
        setAuthSuccess('Account created locally!');
      }
    } else {
      const res = await login(email, password);
      if (!res.success) {
        setAuthError(res.error || 'Login failed.');
      } else {
        setAuthSuccess('Logged in successfully!');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6 animate-fade-in">
      {/* Top Profile Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#DED8C7] shadow-card space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 border-2 border-[#DED8C7] flex items-center justify-center text-3xl shadow-sm">
              {user?.avatarPreset || '🌿'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-forest font-display">
                  {user?.displayName || 'Traveler'}
                </h1>
                {isGuest && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    Guest Roamer
                  </span>
                )}
              </div>
              <p className="text-xs text-secondaryText font-mono mt-0.5">{user?.email}</p>
              <p className="text-xs text-secondaryText italic font-editorial mt-1">
                “{user?.bio || 'Walking the trails and leaving notes.'}”
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStartEdit}
              className="p-2 rounded-xl text-secondaryText hover:text-forest hover:bg-[#F4F0E5] border border-[#E8E3D5] transition-colors"
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0EBE0] text-center">
          <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E3D5]">
            <div className="text-xl font-bold text-forest font-display">{createdNotes.length}</div>
            <div className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-0.5">
              Wayposts Placed
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E3D5]">
            <div className="text-xl font-bold text-forest font-display">{savedCount}</div>
            <div className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-0.5">
              Saved in Journal
            </div>
          </div>
        </div>

        {/* Session Status & Logout */}
        <div className="flex items-center justify-between text-xs text-secondaryText pt-1">
          <span>Joined: {new Date(user?.joinedAt || Date.now()).toLocaleDateString()}</span>
          <button onClick={logout} className="flex items-center gap-1 text-rose-700 hover:text-rose-800 font-semibold"><LogOut className="w-3.5 h-3.5" /><span>Log out</span></button>
        </div>
      </div>

      {/* Guest Account Prompt / Auth Card */}
      {isGuest && (
        <div className="p-6 rounded-3xl bg-[#FAF8F3] border border-[#DED8C7] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest text-sage flex items-center justify-center">
              <Shield className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h3 className="font-bold text-base text-forest font-display">
                Create a Local Test Account
              </h3>
              <p className="text-xs text-secondaryText">
                Save notes under your own name and switch accounts freely on this device.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#EAE4D5]/70 p-1 rounded-2xl border border-[#DED8C7]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-forest text-[#FAF8F3] shadow-sm'
                  : 'text-primaryText hover:text-forest'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                authMode === 'signup'
                  ? 'bg-forest text-[#FAF8F3] shadow-sm'
                  : 'text-primaryText hover:text-forest'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Clara Meadow"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clara@waypost.local"
                className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 pr-9 rounded-xl border border-[#DED8C7] bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-7 text-secondaryText hover:text-primaryText"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-[#FAF8F3] font-semibold text-xs shadow-sm transition-colors mt-2"
            >
              {authMode === 'signup' ? 'Create Local Account' : 'Log In to Account'}
            </button>
          </form>

          {/* Quick Switcher for Existing Accounts */}
          {accounts.length > 0 && (
            <div className="pt-2 border-t border-[#E8E3D5] space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondaryText block">
                Quick Switch to Existing Accounts:
              </span>
              <div className="flex flex-wrap gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => switchAccount(acc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-forest/5 border border-[#DED8C7] text-xs font-medium text-forest shadow-xs"
                  >
                    <span>{acc.avatarPreset || '🌿'}</span>
                    <span>{acc.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User's Created Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-forest font-display">Your Wayposts Placed</h2>
          <span className="text-xs text-secondaryText">{createdNotes.length} notes</span>
        </div>

        {createdNotes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-2">
            <p className="text-xs text-secondaryText">
              You haven't left any wayposts yet. Take a moment to leave a note on the trail!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {createdNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                userLocation={coordinates}
                onClick={() => openNoteDetail(note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF8F3] rounded-3xl shadow-elevated border border-[#DED8C7] p-5 space-y-4">
            <h3 className="font-bold text-base text-forest font-display">Edit Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1.5">
                  Choose Avatar Symbol
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditAvatar(p)}
                      className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-all ${
                        editAvatar === p
                          ? 'border-forest bg-forest/10 scale-110 shadow-xs'
                          : 'border-[#DED8C7] bg-white hover:bg-forest/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                  Bio / Travel Motto
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  maxLength={120}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E3D5]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-xs text-secondaryText hover:text-primaryText"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-forest text-[#FAF8F3] hover:bg-forest-hover"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      <NoteDetailModal
        note={selectedNote}
        isOpen={isDetailOpen}
        onClose={() => {
          closeNoteDetail();
          loadUserData();
        }}
        userLocation={coordinates}
      />
    </div>
  );
};
