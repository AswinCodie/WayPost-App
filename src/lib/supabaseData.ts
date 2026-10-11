import { Category, CategoryFilter, ExpiryDuration, WaypostNote } from '../types';
import { CreateNoteInput } from '../services/notesService';
import { isSupabaseConfigured, supabase } from './supabaseClient';

type NoteRow = {
  id: string;
  title: string | null;
  text: string;
  category: Category;
  latitude: number;
  longitude: number;
  location_name: string | null;
  created_at: string;
  expires_at: string;
  expiry_duration: ExpiryDuration;
  image_paths: string[] | null;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  is_demo: boolean;
  like_count: number;
};

const requireConnection = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.');
  }
};

const toNote = (row: NoteRow): WaypostNote => ({
  id: row.id,
  title: row.title ?? undefined,
  text: row.text,
  category: row.category,
  latitude: row.latitude,
  longitude: row.longitude,
  locationName: row.location_name ?? undefined,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  expiryDuration: row.expiry_duration,
  imageIds: row.image_paths ?? [],
  authorId: row.author_id,
  authorName: row.author_name,
  authorAvatar: row.author_avatar ?? undefined,
  isDemo: row.is_demo,
  likeCount: row.like_count,
});

export const supabaseData = {
  async getActiveNotes(options?: {
    category?: CategoryFilter;
    searchQuery?: string;
    includeExpiredForAuthorId?: string;
  }): Promise<WaypostNote[]> {
    requireConnection();
    let query = supabase.from('notes').select('*').order('created_at', { ascending: false });
    if (options?.category && options.category !== 'All') query = query.eq('category', options.category);
    const { data, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const search = options?.searchQuery?.trim().toLowerCase();
    return ((data ?? []) as NoteRow[])
      .map(toNote)
      .filter((note) => {
        if (new Date(note.expiresAt).getTime() <= now && note.authorId !== options?.includeExpiredForAuthorId) return false;
        if (!search) return true;
        return [note.title, note.text, note.category, note.locationName].some((value) => value?.toLowerCase().includes(search));
      });
  },

  async createNote(input: CreateNoteInput): Promise<WaypostNote> {
    requireConnection();
    const now = new Date();
    const expiresAt = input.expiryDuration === 'lifetime'
      ? '9999-12-31T23:59:59.999Z'
      : new Date(now.getTime() + (input.expiryDuration === '24h' ? 86_400_000 : input.expiryDuration === '3d' ? 259_200_000 : 604_800_000)).toISOString();
    const { data, error } = await supabase.from('notes').insert({
      title: input.title?.trim() || null,
      text: input.text.trim(),
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      location_name: input.locationName?.trim() || 'Waypost Marker',
      created_at: now.toISOString(),
      expires_at: expiresAt,
      expiry_duration: input.expiryDuration,
      image_paths: input.imageIds,
      author_id: input.authorId,
      author_name: input.authorName,
      author_avatar: input.authorAvatar ?? null,
    }).select().single();
    if (error) throw error;
    return toNote(data as NoteRow);
  },

  async updateNote(id: string, updates: Partial<WaypostNote>): Promise<WaypostNote> {
    requireConnection();
    const { data, error } = await supabase.from('notes').update({
      ...(updates.title !== undefined && { title: updates.title || null }),
      ...(updates.text !== undefined && { text: updates.text }),
    }).eq('id', id).select().single();
    if (error) throw error;
    return toNote(data as NoteRow);
  },

  async deleteNote(id: string): Promise<void> {
    requireConnection();
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  async getUserReactions(userId: string): Promise<Set<string>> {
    requireConnection();
    const { data, error } = await supabase.from('reactions').select('note_id').eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.note_id));
  },

  async toggleLike(noteId: string, userId: string, liked: boolean): Promise<void> {
    requireConnection();
    const request = liked
      ? supabase.from('reactions').delete().eq('note_id', noteId).eq('user_id', userId)
      : supabase.from('reactions').insert({ note_id: noteId, user_id: userId });
    const { error } = await request;
    if (error) throw error;
  },

  async getUserBookmarks(userId: string): Promise<Set<string>> {
    requireConnection();
    const { data, error } = await supabase.from('bookmarks').select('note_id').eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.note_id));
  },

  async toggleBookmark(noteId: string, userId: string, saved: boolean): Promise<void> {
    requireConnection();
    const request = saved
      ? supabase.from('bookmarks').delete().eq('note_id', noteId).eq('user_id', userId)
      : supabase.from('bookmarks').insert({ note_id: noteId, user_id: userId });
    const { error } = await request;
    if (error) throw error;
  },

  async uploadImages(files: File[], userId: string): Promise<string[]> {
    requireConnection();
    const paths = await Promise.all(files.map(async (file) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from('waypost-images').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return `storage:${path}`;
    }));
    return paths;
  },
};
