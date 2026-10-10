/**
 * supabaseClient.ts
 * -----------------
 * Creates the Supabase client. If env vars are missing (not yet configured),
 * we create a dummy client so the app doesn't crash — it will show a setup banner.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-public-key-here';

// Create real client if configured, otherwise a stub that will error gracefully
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
    });
