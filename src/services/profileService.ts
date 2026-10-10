import { UserProfile, WaypostNote } from '../types';
import { LocalAuthService } from '../lib/localAuth';
import { localDB } from '../lib/database';

export class ProfileService {
  static getCurrentProfile(): UserProfile | null {
    return LocalAuthService.getCurrentSession();
  }

  static updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    return LocalAuthService.updateUserProfile(updates);
  }

  static getUserCreatedNotes(userId: string): WaypostNote[] {
    return localDB.getUserNotes(userId);
  }

  static getUserSavedCount(userId: string): number {
    return localDB.getUserBookmarkedNotes(userId).length;
  }
}
