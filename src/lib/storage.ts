/**
 * Centralized, safe LocalStorage wrapper with schema versioning and quota handling.
 * UI components must not directly call localStorage.
 */

const SCHEMA_VERSION = 1;
const SCHEMA_KEY = 'waypost_schema_version';

export const STORAGE_KEYS = {
  NOTES: 'waypost_notes_v1',
  ACCOUNTS: 'waypost_accounts_v1',
  SESSION: 'waypost_session_v1',
  REACTIONS: 'waypost_reactions_v1',
  BOOKMARKS: 'waypost_bookmarks_v1',
  REPORTS: 'waypost_reports_v1',
  SETTINGS: 'waypost_settings_v1',
  DEMO_INITIALIZED: 'waypost_demo_initialized_v1',
  LAST_GPS_LOCATION: 'waypost_last_gps_location_v1',
  MAP_VIEWPORT: 'waypost_map_viewport_v1',
} as const;

export class LocalStorageManager {
  static isAvailable(): boolean {
    try {
      const testKey = '__waypost_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[Waypost Storage] Failed to parse key "${key}", using default.`, err);
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err: unknown) {
      console.error(`[Waypost Storage] Failed to save key "${key}". Storage quota may be exceeded.`, err);
      return false;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[Waypost Storage] Failed to remove key "${key}".`, err);
    }
  }

  static checkSchemaAndMigrate(): void {
    try {
      const currentVersion = this.getItem<number>(SCHEMA_KEY, 0);
      if (currentVersion < SCHEMA_VERSION) {
        // Future migrations can be placed here
        this.setItem(SCHEMA_KEY, SCHEMA_VERSION);
      }
    } catch (e) {
      console.error('[Waypost Storage] Schema check failed:', e);
    }
  }

  static clearAllWaypostData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => {
      localStorage.removeItem(k);
    });
    localStorage.removeItem(SCHEMA_KEY);
  }
}
