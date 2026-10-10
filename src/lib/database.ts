import {
  WaypostNote,
  ReactionRecord,
  BookmarkRecord,
  ReportRecord,
  CategoryFilter,
  LocationCoordinates,
  WaypostExportData,
} from '../types';
import { LocalStorageManager, STORAGE_KEYS } from './storage';
import { imageStorage } from './imageStorage';
import { isWithinUnlockRadius } from './location';

class LocalDatabaseService {
  private isInitialized = false;

  /**
   * Initialize local store. If demo data hasn't been seeded yet, populate it.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    LocalStorageManager.checkSchemaAndMigrate();

    this.isInitialized = true;
  }

  // ==========================================
  // NOTES MANAGEMENT
  // ==========================================

  getAllStoredNotes(): WaypostNote[] {
    return LocalStorageManager.getItem<WaypostNote[]>(STORAGE_KEYS.NOTES, []);
  }

  saveAllNotes(notes: WaypostNote[]): void {
    LocalStorageManager.setItem(STORAGE_KEYS.NOTES, notes);
  }

  /**
   * Retrieves active, non-expired notes filtered optionally by category.
   */
  getActiveNotes(options?: {
    category?: CategoryFilter;
    searchQuery?: string;
    includeExpiredForAuthorId?: string;
  }): WaypostNote[] {
    const all = this.getAllStoredNotes();
    const now = Date.now();

    return all.filter((note) => {
      if (note.isDemo) return false;
      // Expiry check
      const expiryTime = new Date(note.expiresAt).getTime();
      const isExpired = expiryTime <= now;

      // If expired and not requested by the note's creator, exclude
      if (isExpired && note.authorId !== options?.includeExpiredForAuthorId) {
        return false;
      }

      // Category filter
      if (options?.category && options.category !== 'All') {
        if (note.category !== options.category) {
          return false;
        }
      }

      // Search query
      if (options?.searchQuery) {
        const query = options.searchQuery.toLowerCase().trim();
        const matchesTitle = note.title?.toLowerCase().includes(query) ?? false;
        const matchesText = note.text.toLowerCase().includes(query);
        const matchesCategory = note.category.toLowerCase().includes(query);
        const matchesLocation = note.locationName?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesText && !matchesCategory && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }

  getNoteById(id: string): WaypostNote | null {
    const all = this.getAllStoredNotes();
    return all.find((n) => n.id === id) || null;
  }

  createNote(note: WaypostNote): WaypostNote {
    const all = this.getAllStoredNotes();
    all.unshift(note);
    this.saveAllNotes(all);
    return note;
  }

  updateNote(id: string, updates: Partial<WaypostNote>): WaypostNote | null {
    const all = this.getAllStoredNotes();
    const idx = all.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    all[idx] = { ...all[idx], ...updates };
    this.saveAllNotes(all);
    return all[idx];
  }

  async deleteNote(id: string): Promise<boolean> {
    const all = this.getAllStoredNotes();
    const noteToDelete = all.find((n) => n.id === id);
    if (!noteToDelete) return false;

    // Clean up stored image blobs in IndexedDB
    if (noteToDelete.imageIds && noteToDelete.imageIds.length > 0) {
      for (const imgId of noteToDelete.imageIds) {
        await imageStorage.deleteImage(imgId);
      }
    }

    const updated = all.filter((n) => n.id !== id);
    this.saveAllNotes(updated);

    // Also remove any bookmarks/reactions referencing this note
    this.removeNoteReferences(id);
    return true;
  }

  private removeNoteReferences(noteId: string): void {
    const bookmarks = this.getBookmarks().filter((b) => b.noteId !== noteId);
    LocalStorageManager.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);

    const reactions = this.getReactions().filter((r) => r.noteId !== noteId);
    LocalStorageManager.setItem(STORAGE_KEYS.REACTIONS, reactions);
  }

  getUserNotes(authorId: string): WaypostNote[] {
    const all = this.getAllStoredNotes();
    return all.filter((n) => n.authorId === authorId);
  }

  // ==========================================
  // LIKES / REACTIONS
  // ==========================================

  getReactions(): ReactionRecord[] {
    return LocalStorageManager.getItem<ReactionRecord[]>(STORAGE_KEYS.REACTIONS, []);
  }

  hasUserLiked(noteId: string, userId: string): boolean {
    const reactions = this.getReactions();
    return reactions.some((r) => r.noteId === noteId && r.userId === userId);
  }

  toggleLike(noteId: string, userId: string): { isLiked: boolean; count: number } {
    const reactions = this.getReactions();
    const existingIndex = reactions.findIndex(
      (r) => r.noteId === noteId && r.userId === userId
    );

    let isLiked = false;
    if (existingIndex !== -1) {
      reactions.splice(existingIndex, 1);
      isLiked = false;
    } else {
      reactions.push({
        id: `lk_${crypto.randomUUID()}`,
        noteId,
        userId,
        createdAt: new Date().toISOString(),
      });
      isLiked = true;
    }

    LocalStorageManager.setItem(STORAGE_KEYS.REACTIONS, reactions);

    // Update note's likeCount cache
    const currentCount = reactions.filter((r) => r.noteId === noteId).length;
    this.updateNote(noteId, { likeCount: currentCount });

    return { isLiked, count: currentCount };
  }

  // ==========================================
  // BOOKMARKS
  // ==========================================

  getBookmarks(): BookmarkRecord[] {
    return LocalStorageManager.getItem<BookmarkRecord[]>(STORAGE_KEYS.BOOKMARKS, []);
  }

  isBookmarked(noteId: string, userId: string): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some((b) => b.noteId === noteId && b.userId === userId);
  }

  toggleBookmark(noteId: string, userId: string): boolean {
    const bookmarks = this.getBookmarks();
    const existingIndex = bookmarks.findIndex(
      (b) => b.noteId === noteId && b.userId === userId
    );

    let isBookmarked = false;
    if (existingIndex !== -1) {
      bookmarks.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      bookmarks.push({
        id: `bm_${crypto.randomUUID()}`,
        noteId,
        userId,
        createdAt: new Date().toISOString(),
      });
      isBookmarked = true;
    }

    LocalStorageManager.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return isBookmarked;
  }

  getUserBookmarkedNotes(userId: string): WaypostNote[] {
    const bookmarks = this.getBookmarks().filter((b) => b.userId === userId);
    const bookmarkedIds = new Set(bookmarks.map((b) => b.noteId));
    const allNotes = this.getAllStoredNotes();

    // Show active and non-expired bookmarked notes
    const now = Date.now();
    return allNotes.filter(
      (n) => bookmarkedIds.has(n.id) && new Date(n.expiresAt).getTime() > now
    );
  }

  // ==========================================
  // REPORTS
  // ==========================================

  getReports(): ReportRecord[] {
    return LocalStorageManager.getItem<ReportRecord[]>(STORAGE_KEYS.REPORTS, []);
  }

  submitReport(report: Omit<ReportRecord, 'id' | 'createdAt'>): ReportRecord {
    const reports = this.getReports();
    const newRecord: ReportRecord = {
      ...report,
      id: `rep_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    reports.push(newRecord);
    LocalStorageManager.setItem(STORAGE_KEYS.REPORTS, reports);
    return newRecord;
  }

  // ==========================================
  // DATA EXPORT / IMPORT / RESET
  // ==========================================

  exportData(): WaypostExportData {
    const accounts = LocalStorageManager.getItem<any[]>(STORAGE_KEYS.ACCOUNTS, []);
    // Strip password hashes before export for hygiene
    const safeUsers = accounts.map(({ passwordHash, ...rest }) => rest);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: this.getAllStoredNotes(),
      users: safeUsers,
      reactions: this.getReactions(),
      bookmarks: this.getBookmarks(),
      reports: this.getReports(),
    };
  }

  importData(data: unknown): { success: boolean; message: string } {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.' };
      }

      const backup = data as Partial<WaypostExportData>;
      if (!Array.isArray(backup.notes)) {
        return { success: false, message: 'Invalid file: notes array is missing.' };
      }

      // Preserve existing user-created notes or merge
      LocalStorageManager.setItem(STORAGE_KEYS.NOTES, backup.notes);
      if (Array.isArray(backup.bookmarks)) {
        LocalStorageManager.setItem(STORAGE_KEYS.BOOKMARKS, backup.bookmarks);
      }
      if (Array.isArray(backup.reactions)) {
        LocalStorageManager.setItem(STORAGE_KEYS.REACTIONS, backup.reactions);
      }
      if (Array.isArray(backup.reports)) {
        LocalStorageManager.setItem(STORAGE_KEYS.REPORTS, backup.reports);
      }

      return {
        success: true,
        message: `Successfully imported ${backup.notes.length} notes!`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Import failed.',
      };
    }
  }

  /**
   * Total wipe of all data (localStorage + IndexedDB).
   */
  async clearAllLocalData(): Promise<void> {
    LocalStorageManager.clearAllWaypostData();
    await imageStorage.clearAllImages();
    this.isInitialized = false;
  }
}

export const localDB = new LocalDatabaseService();
