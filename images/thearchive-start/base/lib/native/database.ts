import { IS_NATIVE } from "../platform";

interface SyncQueueEntry {
  id: string;
  action: string;
  payload: string;
  created_at: number;
}

let db: any = null;

export async function initDatabase(): Promise<void> {
  if (!IS_NATIVE) return;

  try {
    const { SQLiteConnection, CapacitorSQLite } =
      await import("@capacitor-community/sqlite");
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    db = await sqlite.createConnection(
      "the-archive",
      false,
      "no-encryption",
      1,
      false,
    );
    await db.open();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS offline_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  } catch {
    db = null;
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.close();
    } catch {
      // Ignore close errors
    }
    db = null;
  }
}

export async function addToSyncQueue(
  action: string,
  payload: unknown,
): Promise<void> {
  if (!db) return;

  const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await db.run(
      "INSERT INTO sync_queue (id, action, payload, created_at) VALUES (?, ?, ?, ?)",
      [id, action, JSON.stringify(payload), Date.now()],
    );
  } catch {
    // Silently fail — queue is non-critical
  }
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  if (!db) return [];

  try {
    const result = await db.query(
      "SELECT * FROM sync_queue ORDER BY created_at ASC",
    );
    return result.values ?? [];
  } catch {
    return [];
  }
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  if (!db) return;

  try {
    await db.run("DELETE FROM sync_queue WHERE id = ?", [id]);
  } catch {
    // Ignore
  }
}

export async function cacheData(key: string, value: unknown): Promise<void> {
  if (!db) return;

  try {
    await db.run(
      "INSERT OR REPLACE INTO offline_cache (key, value, updated_at) VALUES (?, ?, ?)",
      [key, JSON.stringify(value), Date.now()],
    );
  } catch {
    // Silently fail
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!db) return null;

  try {
    const result = await db.query(
      "SELECT value FROM offline_cache WHERE key = ?",
      [key],
    );
    if (result.values && result.values.length > 0) {
      return JSON.parse(result.values[0].value) as T;
    }
    return null;
  } catch {
    return null;
  }
}
