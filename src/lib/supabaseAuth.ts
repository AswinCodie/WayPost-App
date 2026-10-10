/**
 * supabaseAuth.ts
 * ---------------
 * Replaces localAuth.ts. All auth goes through Supabase.
 * Supports: email/password signup+login, anonymous guest sessions,
 * and named guests (stored in profile metadata).
 */
import { supabase } from './supabaseClient';
import type { UserProfile } from '../types';

// ────────────────────────────────────────────
// Guest anonymous identity
// ────────────────────────────────────────────
export const GUEST_FALLBACK_PROFILE: UserProfile = {
  id: 'guest_wanderer',
  displayName: 'Wanderer',
  email: '',
  bio: 'Roaming through little notes on long journeys.',
  avatarPreset: '🌲',
  joinedAt: new Date().toISOString(),
};

// ────────────────────────────────────────────
// Map Supabase user + profile → UserProfile
// ────────────────────────────────────────────
export function profileFromRow(row: {
  id: string;
  display_name: string;
  bio?: string | null;
  avatar_preset?: string | null;
  is_guest?: boolean;
  created_at: string;
}, email = ''): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    email,
    bio: row.bio ?? undefined,
    avatarPreset: row.avatar_preset ?? '🌿',
    joinedAt: row.created_at,
    isGuest: row.is_guest ?? false,
  };
}

async function ensureProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: typeof metadata.display_name === 'string' ? metadata.display_name : user.email?.split('@')[0] || 'Traveler',
    bio: typeof metadata.bio === 'string' ? metadata.bio : null,
    avatar_preset: typeof metadata.avatar_preset === 'string' ? metadata.avatar_preset : '🌿',
    is_guest: metadata.is_guest === true,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) console.warn('[Waypost] Profile was not created:', error.message);
}

// ────────────────────────────────────────────
// Sign up (email + password + display name)
// ────────────────────────────────────────────
export async function signUp(data: {
  email: string;
  password: string;
  displayName: string;
  avatarPreset?: string;
  bio?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      data: {
        display_name: data.displayName.trim(),
        avatar_preset: data.avatarPreset ?? '🌿',
        bio: data.bio ?? 'Waypost explorer & note seeker.',
        is_guest: false,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!authData.user) {
    return { success: false, error: 'Signup failed. Please try again.' };
  }

  // This is harmless when the SQL trigger is installed, and repairs accounts
  // created before that trigger existed.
  await ensureProfile(authData.user);

  // Fetch the auto-created profile
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  const user = profileRow
    ? profileFromRow(profileRow, authData.user.email ?? '')
    : {
        id: authData.user.id,
        displayName: data.displayName.trim(),
        email: data.email,
        avatarPreset: data.avatarPreset ?? '🌿',
        bio: data.bio,
        joinedAt: new Date().toISOString(),
        isGuest: false,
      };

  return { success: true, user };
}

// ────────────────────────────────────────────
// Login (email + password)
// ────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login')) {
      return { success: false, error: 'Incorrect email or password.' };
    }
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Login failed. Please try again.' };
  }

  await ensureProfile(data.user);

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const user = profileRow
    ? profileFromRow(profileRow, data.user.email ?? '')
    : GUEST_FALLBACK_PROFILE;

  return { success: true, user };
}

// ────────────────────────────────────────────
// Continue as Guest (Supabase anonymous sign-in)
// with optional custom display name
// ────────────────────────────────────────────
export async function continueAsGuest(displayName?: string): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  const guestName = displayName?.trim() || 'Wanderer';

  // Use Supabase anonymous sign-in (requires Anon sign-in enabled in Supabase Auth settings)
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        display_name: guestName,
        avatar_preset: '🌲',
        bio: 'A curious wanderer passing through.',
        is_guest: true,
      },
    },
  });

  if (error) {
    // If anon sign-in is disabled, fall back to local guest
    console.warn('[Waypost] Anonymous sign-in unavailable, using local guest mode:', error.message);
    const localGuest: UserProfile = {
      ...GUEST_FALLBACK_PROFILE,
      displayName: guestName,
      id: `guest_${crypto.randomUUID().slice(0, 8)}`,
    };
    return { success: true, user: localGuest };
  }

  await ensureProfile(data.user!);

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single();

  const user: UserProfile = profileRow
    ? profileFromRow(profileRow, '')
    : {
        id: data.user!.id,
        displayName: guestName,
        email: '',
        avatarPreset: '🌲',
        bio: 'A curious wanderer passing through.',
        joinedAt: new Date().toISOString(),
        isGuest: true,
      };

  return { success: true, user };
}

// ────────────────────────────────────────────
// Sign out
// ────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ────────────────────────────────────────────
// Get current session's UserProfile
// ────────────────────────────────────────────
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profileRow) return null;
  return profileFromRow(profileRow, session.user.email ?? '');
}

// ────────────────────────────────────────────
// Update profile (display name, bio, avatar)
// ────────────────────────────────────────────
export async function updateProfile(updates: {
  displayName?: string;
  bio?: string;
  avatarPreset?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, error: 'Not authenticated.' };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(updates.displayName !== undefined && { display_name: updates.displayName }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.avatarPreset !== undefined && { avatar_preset: updates.avatarPreset }),
    })
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, user: profileFromRow(data, session.user.email ?? '') };
}
