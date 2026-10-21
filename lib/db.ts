import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

// Für Tests: Erlaubt das Setzen einer eigenen DB-Instanz
let testDbInstance: any = null;

export function setTestDb(db: any) {
  testDbInstance = db;
  // Reset production DB instance to avoid conflicts
  dbInstance = null;
  pool = null;
}

export function clearTestDb() {
  testDbInstance = null;
}

export function getDb() {
  // Test-DB hat Vorrang
  if (testDbInstance) {
    return testDbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (!dbInstance) {
    try {
      pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      dbInstance = drizzle(pool, { schema });
    } catch (err) {
      console.warn('[DB] PostgreSQL Verbindung konnte nicht aufgebaut werden:', err);
      return null;
    }
  }

  return dbInstance;
}

export { schema };
