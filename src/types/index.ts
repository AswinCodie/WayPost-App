export type Category = 
  | 'Stories'
  | 'Kindness'
  | 'Travel'
  | 'Food'
  | 'Advice'
  | 'Odd Little Things';

export type CategoryFilter = 'All' | Category;

export type ExpiryDuration = '24h' | '3d' | '7d' | 'lifetime';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface WaypostNote {
  id: string;
  title?: string;
  text: string; // max 220 chars
  category: Category;
  latitude: number;
  longitude: number;
  locationName?: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  expiryDuration: ExpiryDuration;
  imageIds: string[]; // references IndexedDB image records
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isDemo?: boolean;
  likeCount: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarId?: string; // IndexedDB or preset
  avatarPreset?: string;
  joinedAt: string;
  isGuest?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // SHA-256 client hashed
  displayName: string;
  bio?: string;
  avatarId?: string;
  avatarPreset?: string;
  createdAt: string;
}

export interface ReactionRecord {
  id: string;
  noteId: string;
  userId: string;
  createdAt: string;
}

export interface BookmarkRecord {
  id: string;
  noteId: string;
  userId: string;
  createdAt: string;
}

export type ReportReason = 
  | 'Spam'
  | 'Harassment'
  | 'Inappropriate content'
  | 'Misleading location'
  | 'Privacy concern'
  | 'Other';

export interface ReportRecord {
  id: string;
  noteId: string;
  userId?: string;
  reason: ReportReason;
  comment?: string;
  createdAt: string;
}

export interface LocationState {
  coordinates: LocationCoordinates;
  accuracy?: number;
  isSimulated: boolean;
  presetName?: string;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  error?: string;
}

export interface StoredImageData {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface WaypostExportData {
  version: number;
  exportedAt: string;
  notes: WaypostNote[];
  users: Omit<UserAccount, 'passwordHash'>[]; // safe export
  reactions: ReactionRecord[];
  bookmarks: BookmarkRecord[];
  reports: ReportRecord[];
}
