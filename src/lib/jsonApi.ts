import { CategoryFilter, WaypostNote } from '../types';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });
  if (!response.ok) throw new Error(`Shared data server error (${response.status}).`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};
export const jsonApi = {
  async notes(options?: { category?: CategoryFilter; searchQuery?: string; includeExpiredForAuthorId?: string }) {
    const all = await request<WaypostNote[]>('/notes'); const now = Date.now(); const search = options?.searchQuery?.trim().toLowerCase();
    return all.filter((note) => !note.isDemo && (new Date(note.expiresAt).getTime() > now || note.authorId === options?.includeExpiredForAuthorId) && (!options?.category || options.category === 'All' || note.category === options.category) && (!search || [note.title, note.text, note.category, note.locationName].some((v) => v?.toLowerCase().includes(search)))).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },
  createNote: (note: WaypostNote) => request<WaypostNote>('/notes', { method: 'POST', body: JSON.stringify(note) }),
  updateNote: (id: string, updates: Partial<WaypostNote>) => request<WaypostNote>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
  reactions: (userId: string) => request<{ id: string; noteId: string; userId: string }[]>(`/reactions?userId=${encodeURIComponent(userId)}`),
  bookmarks: (userId: string) => request<{ id: string; noteId: string; userId: string }[]>(`/bookmarks?userId=${encodeURIComponent(userId)}`),
  addReaction: (noteId: string, userId: string) => request('/reactions', { method: 'POST', body: JSON.stringify({ id: `lk_${crypto.randomUUID()}`, noteId, userId, createdAt: new Date().toISOString() }) }),
  removeReaction: (id: string) => request<void>(`/reactions/${id}`, { method: 'DELETE' }),
  addBookmark: (noteId: string, userId: string) => request('/bookmarks', { method: 'POST', body: JSON.stringify({ id: `bm_${crypto.randomUUID()}`, noteId, userId, createdAt: new Date().toISOString() }) }),
  removeBookmark: (id: string) => request<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
};
