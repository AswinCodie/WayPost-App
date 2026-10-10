/**
 * IndexedDB Binary Image Storage for Waypost.
 * Handles storage of photo blobs without clogging LocalStorage.
 * Manages object URLs with proper caching and revocation.
 */

const DB_NAME = 'waypost_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class ImageStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private urlCache = new Map<string, string>();

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not supported in this browser environment.'));
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error || new Error('Failed to open IndexedDB'));
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a photo blob into IndexedDB.
   * Returns a unique ID for referencing in note metadata.
   */
  async saveImage(blob: Blob, name: string = 'waypost-photo.jpg'): Promise<string> {
    const id = `img_${crypto.randomUUID()}`;
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        id,
        blob,
        name,
        type: blob.type || 'image/jpeg',
        size: blob.size,
        createdAt: new Date().toISOString(),
      };

      const request = store.put(record);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to store image in IndexedDB'));
      };
    });
  }

  /**
   * Retrieve a Blob by its ID.
   */
  async getImageBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.blob instanceof Blob) {
            resolve(result.blob);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          reject(request.error || new Error('Failed to retrieve image blob'));
        };
      });
    } catch (e) {
      console.warn(`[ImageStorage] Error fetching blob for id ${id}:`, e);
      return null;
    }
  }

  /**
   * Get an Object URL for rendering in <img> or Leaflet popup.
   * Cached until explicitly revoked or session ends.
   */
  async getImageUrl(id: string): Promise<string | null> {
    if (this.urlCache.has(id)) {
      return this.urlCache.get(id)!;
    }

    const blob = await this.getImageBlob(id);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    this.urlCache.set(id, url);
    return url;
  }

  /**
   * Revoke an active Object URL to free memory.
   */
  revokeImageUrl(id: string): void {
    const url = this.urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.urlCache.delete(id);
    }
  }

  /**
   * Delete an image record from IndexedDB.
   */
  async deleteImage(id: string): Promise<boolean> {
    this.revokeImageUrl(id);
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Count total stored images.
   */
  async getImageCount(): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Clear all images from IndexedDB.
   */
  async clearAllImages(): Promise<void> {
    // Revoke all cached URLs
    this.urlCache.forEach((url) => URL.revokeObjectURL(url));
    this.urlCache.clear();

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('[ImageStorage] Failed to clear DB:', e);
    }
  }

  /**
   * Helper to create an illustrative demo photo blob as SVG/JPEG.
   */
  async createSamplePhotoBlob(title: string, color: string, iconSymbol: string): Promise<Blob> {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#18392D;stop-opacity:0.9" />
          </linearGradient>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
            <feBlend mode="overlay"/>
          </filter>
        </defs>
        <rect width="800" height="600" fill="url(#grad)" />
        <rect width="800" height="600" filter="url(#noise)" opacity="0.3"/>
        <circle cx="400" cy="270" r="100" fill="#F4F0E5" opacity="0.15"/>
        <text x="400" y="295" font-size="72" text-anchor="middle" fill="#FAF8F3" font-family="system-ui, sans-serif">${iconSymbol}</text>
        <text x="400" y="440" font-size="34" font-weight="600" text-anchor="middle" fill="#FAF8F3" font-family="Plus Jakarta Sans, sans-serif">${title}</text>
        <text x="400" y="480" font-size="20" text-anchor="middle" fill="#C8D3C5" font-family="Newsreader, serif" font-style="italic">Waypost Discovery</text>
      </svg>
    `.trim();

    return new Blob([svgString], { type: 'image/svg+xml' });
  }
}

export const imageStorage = new ImageStorageService();
