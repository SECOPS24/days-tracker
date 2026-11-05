import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join('/data', 'days-tracker.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      start_date TEXT NOT NULL,
      end_date TEXT,
      cycle_length INTEGER,
      period_length INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id TEXT PRIMARY KEY,
      cycle_id TEXT,
      user_id TEXT NOT NULL DEFAULT 'default',
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      severity INTEGER CHECK(severity BETWEEN 1 AND 5),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cycles_user ON cycles(user_id);
    CREATE INDEX IF NOT EXISTS idx_symptoms_user ON symptoms(user_id);
    CREATE INDEX IF NOT EXISTS idx_symptoms_date ON symptoms(date);
  `);

  console.log('Database initialised at', DB_PATH);
}
