import { WaypostNote, CategoryFilter, LocationCoordinates, ExpiryDuration, Category } from '../types';
import { localDB } from '../lib/database';
import { isWithinUnlockRadius, calculateDistanceMeters, UNLOCK_RADIUS_METERS } from '../lib/location';

export interface CreateNoteInput {
  title?: string;
  text: string;
  category: Category;
  latitude: number;
  longitude: number;
  locationName?: string;
  expiryDuration: ExpiryDuration;
  imageIds: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

export class NotesService {
  static getActiveNotes(options?: {
    category?: CategoryFilter;
    searchQuery?: string;
    includeExpiredForAuthorId?: string;
  }): WaypostNote[] {
    return localDB.getActiveNotes(options);
  }

  static getNoteById(id: string): WaypostNote | null {
    return localDB.getNoteById(id);
  }

  static createNote(input: CreateNoteInput): WaypostNote {
    const now = Date.now();
    let durationMs = 24 * 60 * 60 * 1000;
    if (input.expiryDuration === '3d') {
      durationMs = 3 * 24 * 60 * 60 * 1000;
    } else if (input.expiryDuration === '7d') {
      durationMs = 7 * 24 * 60 * 60 * 1000;
    }

    const newNote: WaypostNote = {
      id: `wp_${crypto.randomUUID()}`,
      title: input.title?.trim() || undefined,
      text: input.text.trim(),
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      locationName: input.locationName?.trim() || 'Waypost Marker',
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + durationMs).toISOString(),
      expiryDuration: input.expiryDuration,
      imageIds: input.imageIds,
      authorId: input.authorId,
      authorName: input.authorName,
      authorAvatar: input.authorAvatar,
      isDemo: false,
      likeCount: 0,
    };

    return localDB.createNote(newNote);
  }

  static updateNote(id: string, updates: Partial<WaypostNote>): WaypostNote | null {
    return localDB.updateNote(id, updates);
  }

  static async deleteNote(id: string): Promise<boolean> {
    return localDB.deleteNote(id);
  }

  static isNoteUnlocked(note: WaypostNote, userLocation: LocationCoordinates): boolean {
    return isWithinUnlockRadius(
      userLocation,
      { latitude: note.latitude, longitude: note.longitude },
      UNLOCK_RADIUS_METERS
    );
  }

  static getDistanceToNote(note: WaypostNote, userLocation: LocationCoordinates): number {
    return calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      note.latitude,
      note.longitude
    );
  }
}
