import { localDB } from '../lib/database';

export class ReactionsService {
  static hasUserLiked(noteId: string, userId: string): boolean {
    return localDB.hasUserLiked(noteId, userId);
  }

  static toggleLike(noteId: string, userId: string): { isLiked: boolean; count: number } {
    return localDB.toggleLike(noteId, userId);
  }
}
