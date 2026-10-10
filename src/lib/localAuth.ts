import { UserAccount, UserProfile } from '../types';
import { LocalStorageManager, STORAGE_KEYS } from './storage';
import { API_BASE } from './jsonApi';

const SALT = 'waypost_local_salt_v1:';
// `/api` is proxied by Vite in development. Vercel builds use the public
// Render URL supplied as VITE_API_URL instead.
const ACCOUNTS_API = `${API_BASE}/accounts`;

async function getSharedAccounts(): Promise<UserAccount[]> {
  const response = await fetch(ACCOUNTS_API);
  if (!response.ok) throw new Error('The shared Waypost server is unavailable. Start `npm run api` on the host computer.');
  return response.json() as Promise<UserAccount[]>;
}

/**
 * Hash password client-side using Web Crypto SHA-256.
 * Note: Prototype only, not a substitute for server-side auth.
 */
export async function hashPasswordClientSide(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const GUEST_USER: UserProfile = {
  id: 'guest_wanderer',
  displayName: 'Wanderer',
  email: 'wanderer@waypost.local',
  bio: 'Roaming through little notes on long journeys.',
  avatarPreset: '🌲',
  joinedAt: new Date().toISOString(),
};

export class LocalAuthService {
  static getAccounts(): UserAccount[] {
    return LocalStorageManager.getItem<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  }

  static saveAccounts(accounts: UserAccount[]): void {
    LocalStorageManager.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  static getCurrentSession(): UserProfile | null {
    return LocalStorageManager.getItem<UserProfile | null>(STORAGE_KEYS.SESSION, null);
  }

  static setCurrentSession(user: UserProfile | null): void {
    if (user) {
      LocalStorageManager.setItem(STORAGE_KEYS.SESSION, user);
    } else {
      LocalStorageManager.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  static async signup(data: {
    displayName: string;
    email: string;
    password: string;
    avatarPreset?: string;
    bio?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.displayName.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    let accounts: UserAccount[];
    try {
      accounts = await getSharedAccounts();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not reach the shared account server.' };
    }
    if (accounts.some((a) => a.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const passwordHash = await hashPasswordClientSide(data.password);
    const newAccount: UserAccount = {
      id: `usr_${crypto.randomUUID()}`,
      displayName: trimmedName,
      email: trimmedEmail,
      passwordHash,
      bio: data.bio || 'Waypost explorer & note seeker.',
      avatarPreset: data.avatarPreset || '🌿',
      createdAt: new Date().toISOString(),
    };

    const createResponse = await fetch(ACCOUNTS_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount),
    });
    if (!createResponse.ok) return { success: false, error: 'Could not create the shared account.' };
    // Keep a local cache only for offline profile display; authentication uses the shared API.
    this.saveAccounts([...this.getAccounts().filter((a) => a.id !== newAccount.id), newAccount]);

    const profile: UserProfile = {
      id: newAccount.id,
      displayName: newAccount.displayName,
      email: newAccount.email,
      bio: newAccount.bio,
      avatarPreset: newAccount.avatarPreset,
      joinedAt: newAccount.createdAt,
    };

    this.setCurrentSession(profile);
    return { success: true, user: profile };
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    let accounts: UserAccount[];
    try {
      accounts = await getSharedAccounts();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not reach the shared account server.' };
    }
    let account = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

    // One-time migration for accounts created before the shared JSON server
    // was enabled. The user must still supply the correct password below.
    if (!account) {
      const localAccount = this.getAccounts().find((a) => a.email.toLowerCase() === trimmedEmail);
      if (localAccount) {
        const migration = await fetch(ACCOUNTS_API, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localAccount),
        });
        if (migration.ok) account = localAccount;
      }
    }

    if (!account) {
      return { success: false, error: 'No account found with this email address.' };
    }

    const inputHash = await hashPasswordClientSide(password);
    if (inputHash !== account.passwordHash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const profile: UserProfile = {
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      bio: account.bio,
      avatarId: account.avatarId,
      avatarPreset: account.avatarPreset,
      joinedAt: account.createdAt,
    };

    this.setCurrentSession(profile);
    return { success: true, user: profile };
  }

  static logout(): void {
    this.setCurrentSession(null);
  }

  static useGuestSession(displayName?: string): UserProfile {
    const profile: UserProfile = {
      id: `guest_${crypto.randomUUID()}`,
      displayName: displayName?.trim() || 'Guest',
      email: '', avatarPreset: '🌿', joinedAt: new Date().toISOString(), isGuest: true,
    };
    this.setCurrentSession(profile);
    return profile;
  }

  static updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentSession();
    if (!current) return null;

    const updatedSession: UserProfile = { ...current, ...updates };
    this.setCurrentSession(updatedSession);

    // Also update account record if not guest
    if (!current.isGuest) {
      const accounts = this.getAccounts();
      const idx = accounts.findIndex((a) => a.id === current.id);
      if (idx !== -1) {
        accounts[idx] = {
          ...accounts[idx],
          displayName: updates.displayName ?? accounts[idx].displayName,
          bio: updates.bio ?? accounts[idx].bio,
          avatarPreset: updates.avatarPreset ?? accounts[idx].avatarPreset,
          avatarId: updates.avatarId ?? accounts[idx].avatarId,
        };
        this.saveAccounts(accounts);
      }
    }

    return updatedSession;
  }
}
