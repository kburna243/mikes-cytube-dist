/**
 * IndexedDB Offline Engine & Synchronization Manager
 * Spezifikation: TEIL C (Offline-Schreiben, Sync-Warteschlange & Konfliktschutz)
 */

const DB_NAME = 'federfuehrer_offline_db';
const DB_VERSION = 1;

export interface OfflineDraft {
  chapterId: string;
  title: string;
  body: string;
  localVersion: number;
  baseServerVersion: number;
  lastModified: number;
}

export interface SyncQueueItem {
  id?: number;
  chapterId: string;
  title: string;
  body: string;
  baseServerVersion: number;
  queuedAt: number;
}

export interface SyncConflict {
  chapterId: string;
  chapterTitle: string;
  localContent: string;
  serverContent: string;
  detectedAt: number;
}

export type SyncStatus = 'saved' | 'offline_saved' | 'syncing' | 'conflict';

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private statusListeners: Array<(status: SyncStatus) => void> = [];
  private currentStatus: SyncStatus = 'saved';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushSyncQueue());
      window.addEventListener('offline', () => this.setStatus('offline_saved'));
    }
  }

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'chapterId' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'chapterId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  public setStatus(status: SyncStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Speichert einen Entwurf lokal in IndexedDB
   */
  async saveDraft(chapterId: string, title: string, body: string, baseServerVersion: number = 1): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');

      const draft: OfflineDraft = {
        chapterId,
        title,
        body,
        localVersion: Date.now(),
        baseServerVersion,
        lastModified: Date.now(),
      };

      const req = store.put(draft);
      req.onsuccess = () => {
        if (!navigator.onLine) {
          this.setStatus('offline_saved');
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Liest einen lokalen Entwurf
   */
  async getDraft(chapterId: string): Promise<OfflineDraft | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const req = store.get(chapterId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fügt eine Änderung in die Sync-Warteschlange ein
   */
  async enqueueSync(chapterId: string, title: string, body: string, baseServerVersion: number): Promise<void> {
    await this.saveDraft(chapterId, title, body, baseServerVersion);
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');

      const item: SyncQueueItem = {
        chapterId,
        title,
        body,
        baseServerVersion,
        queuedAt: Date.now(),
      };

      const req = store.add(item);
      req.onsuccess = () => {
        this.setStatus(navigator.onLine ? 'syncing' : 'offline_saved');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Arbeitet die Sync-Warteschlange ab, sobald wieder Verbindung besteht
   */
  async flushSyncQueue(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline_saved');
      return;
    }

    const db = await this.open();
    const items: SyncQueueItem[] = await new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (items.length === 0) {
      this.setStatus('saved');
      return;
    }

    this.setStatus('syncing');

    for (const item of items) {
      try {
        const res = await fetch(`/api/v1/chapters/${item.chapterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            body: item.body,
            baseServerVersion: item.baseServerVersion,
          }),
        });

        if (res.status === 409) {
          // Konflikt: Server-Version ist neuer!
          const serverData = await res.json();
          await this.saveConflict(item.chapterId, item.title, item.body, serverData.body || '');
          this.setStatus('conflict');
          continue;
        }

        if (res.ok) {
          // Erfolgreich synchronisiert -> Element aus Warteschlange löschen
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('sync_queue', 'readwrite');
            const store = tx.objectStore('sync_queue');
            if (item.id !== undefined) {
              const delReq = store.delete(item.id);
              delReq.onsuccess = () => resolve();
              delReq.onerror = () => reject(delReq.error);
            } else {
              resolve();
            }
          });
        }
      } catch (err) {
        console.warn('[OfflineDb] Sync-Fehler:', err);
        this.setStatus('offline_saved');
        return;
      }
    }

    this.setStatus('saved');
  }

  /**
   * Speichert einen Versionskonflikt zur manuellen Entscheidung durch die Autorin
   */
  async saveConflict(
    chapterId: string,
    chapterTitle: string,
    localContent: string,
    serverContent: string
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conflicts', 'readwrite');
      const store = tx.objectStore('conflicts');

      const conflict: SyncConflict = {
        chapterId,
        chapterTitle,
        localContent,
        serverContent,
        detectedAt: Date.now(),
      };

      const req = store.put(conflict);
      req.onsuccess = () => {
        this.setStatus('conflict');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getConflict(chapterId: string): Promise<SyncConflict | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conflicts', 'readonly');
      const store = tx.objectStore('conflicts');
      const req = store.get(chapterId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async resolveConflict(chapterId: string, chosenContent: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('conflicts', 'readwrite');
      const store = tx.objectStore('conflicts');
      const req = store.delete(chapterId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Nach Auflösung den gewählten Inhalt an den Server senden
    await fetch(`/api/v1/chapters/${chapterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: chosenContent }),
    });

    this.setStatus('saved');
  }
}

export const offlineDb = new OfflineDatabase();

/**
 * Screen Wake Lock API (Hält den Bildschirm des Tablets während des Schreibens aktiv)
 */
let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function releaseScreenWakeLock(): void {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}
