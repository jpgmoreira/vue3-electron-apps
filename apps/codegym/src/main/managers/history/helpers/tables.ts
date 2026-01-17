import type { Database } from 'sqlite';

export async function createHistoryTables(db: Database) {
  await Promise.all([
    db.exec(`
      CREATE TABLE IF NOT EXISTS cf (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'cf' CHECK (oj = 'cf'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        solved INTEGER NOT NULL,
        rating INTEGER,
        popularity INTEGER NOT NULL,
        tags TEXT -- JSON string array (e.g. '["dp","math"]')
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS kattis (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'kattis' CHECK (oj = 'kattis'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        solved INTEGER NOT NULL,
        submissions INTEGER NOT NULL,
        textDifficulty TEXT NOT NULL,
        difficulty INTEGER,
        popularity INTEGER NOT NULL,
        starred BOOLEAN NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS neps (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'neps' CHECK (oj = 'neps'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        score INTEGER NOT NULL,
        solved INTEGER NOT NULL,
        popularity INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS leetcode (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'leetcode' CHECK (oj = 'leetcode'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        accepted INTEGER NOT NULL,
        difficulty INTEGER NOT NULL,
        premium BOOLEAN NOT NULL,
        popularity INTEGER NOT NULL,
        submissions INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS timus (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'timus' CHECK (oj = 'timus'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        solved INTEGER NOT NULL,
        source TEXT,
        difficulty INTEGER NOT NULL,
        popularity INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS uva (
        id TEXT PRIMARY KEY,
        oj TEXT NOT NULL DEFAULT 'uva' CHECK (oj = 'uva'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solvedDate INTEGER,
        timestamp INTEGER,
        dacu INTEGER NOT NULL,
        popularity INTEGER NOT NULL,
        starred BOOLEAN NOT NULL
      );
    `),
  ]);

  await Promise.all([
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cf_timestamp ON cf (timestamp);`),
    db.exec(`CREATE INDEX IF NOT EXISTS idx_kattis_timestamp ON kattis (timestamp);`),
    db.exec(`CREATE INDEX IF NOT EXISTS idx_neps_timestamp ON neps (timestamp);`),
    db.exec(`CREATE INDEX IF NOT EXISTS idx_leetcode_timestamp ON leetcode (timestamp);`),
    db.exec(`CREATE INDEX IF NOT EXISTS idx_timus_timestamp ON timus (timestamp);`),
    db.exec(`CREATE INDEX IF NOT EXISTS idx_uva_timestamp ON uva (timestamp);`),
  ]);
}
