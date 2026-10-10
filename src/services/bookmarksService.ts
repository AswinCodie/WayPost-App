import { WaypostNote } from '../types';
import { localDB } from '../lib/database';

export class BookmarksService {
  static isBookmarked(noteId: string, userId: string): boolean {
    return localDB.isBookmarked(noteId, userId);
  }

  static toggleBookmark(noteId: string, userId: string): boolean {
    return localDB.toggleBookmark(noteId, userId);
  }

  static getUserBookmarkedNotes(userId: string): WaypostNote[] {
    return localDB.getUserBookmarkedNotes(userId);
  }
}
