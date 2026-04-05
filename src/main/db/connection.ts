import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { DB_FILENAME } from '../../shared/constants';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

export function getDbPath(): string {
  const dir = path.join(os.homedir(), '.clawpilot');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, DB_FILENAME);
}

export function initDb(): ReturnType<typeof drizzle> {
  if (db) return db;

  const dbPath = getDbPath();
  sqlite = new Database(dbPath);

  // Performance pragmas
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('cache_size = -64000');   // 64MB
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('temp_store = MEMORY');
  sqlite.pragma('mmap_size = 268435456'); // 256MB

  db = drizzle(sqlite, { schema });
  return db;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function getSqlite(): Database.Database {
  if (!sqlite) throw new Error('Database not initialized. Call initDb() first.');
  return sqlite;
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
