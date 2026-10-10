import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LocalAuthService } from '../lib/localAuth';
import { localDB } from '../lib/database';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null; isGuest: boolean; isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { displayName: string; email: string; password: string; avatarPreset?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterAsGuest: (displayName?: string) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: (displayName?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  accounts: UserProfile[]; switchAccount: (account: UserProfile) => void; isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { setUser(LocalAuthService.getCurrentSession()); setIsLoading(false); }, []);
  const login = useCallback(async (email: string, password: string) => { const result = await LocalAuthService.login(email, password); if (result.user) setUser(result.user); return { success: result.success, error: result.error }; }, []);
  const signup = useCallback(async (data: { displayName: string; email: string; password: string; avatarPreset?: string; bio?: string }) => {
    const guest = LocalAuthService.getCurrentSession(); const result = await LocalAuthService.signup(data);
    if (result.user && guest?.isGuest) localDB.saveAllNotes(localDB.getAllStoredNotes().map((note) => note.authorId === guest.id ? { ...note, authorId: result.user!.id, authorName: result.user!.displayName, authorAvatar: result.user!.avatarPreset } : note));
    if (result.user) setUser(result.user); return { success: result.success, error: result.error };
  }, []);
  const logout = useCallback(async () => { LocalAuthService.logout(); setUser(null); }, []);
  const enterAsGuest = useCallback(async (displayName?: string) => { setUser(LocalAuthService.useGuestSession(displayName)); return { success: true }; }, []);
  const updateProfile = useCallback((updates: Partial<UserProfile>) => { const updated = LocalAuthService.updateUserProfile(updates); if (updated) setUser(updated); }, []);
  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout, enterAsGuest, continueAsGuest: enterAsGuest, updateProfile, updateUserProfile: async (updates) => updateProfile(updates), isGuest: user?.isGuest === true, accounts: [], switchAccount: () => {}, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; };
