import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';
import type { Database } from 'sqlite';
import { getOjProblemColumnsAndValues } from '../../utils';

const SQLITE_MAX_VARIABLES = 999;

export async function createCacheTables(db: Database) {
  await Promise.all([
    db.exec(`
      CREATE TABLE IF NOT EXISTS cf (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'cf' CHECK (oj = 'cf'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solved INTEGER NOT NULL,
        rating INTEGER,
        popularity INTEGER NOT NULL,
        tags TEXT -- JSON string array (e.g. '["dp","math"]')
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS kattis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'kattis' CHECK (oj = 'kattis'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'neps' CHECK (oj = 'neps'),
        name TEXT, -- Neps name can be null
        path TEXT NOT NULL,
        score INTEGER NOT NULL,
        solved INTEGER NOT NULL,
        popularity INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS leetcode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'leetcode' CHECK (oj = 'leetcode'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        accepted INTEGER NOT NULL,
        difficulty INTEGER NOT NULL,
        premium BOOLEAN NOT NULL,
        popularity INTEGER NOT NULL,
        submissions INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS timus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'timus' CHECK (oj = 'timus'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        solved INTEGER NOT NULL,
        source TEXT,
        difficulty INTEGER NOT NULL,
        popularity INTEGER NOT NULL
      );
    `),
    db.exec(`
      CREATE TABLE IF NOT EXISTS uva (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oj TEXT NOT NULL DEFAULT 'uva' CHECK (oj = 'uva'),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        dacu INTEGER NOT NULL,
        popularity INTEGER NOT NULL,
        starred BOOLEAN NOT NULL
      );
    `),
  ]);
}

export async function replaceCacheProblems(db: Database, oj: Oj, problems: OjProblem[Oj][]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`DELETE FROM ${oj}`);
    if (problems.length === 0) {
      await db.run('COMMIT');
      return;
    }
    const { columns } = getOjProblemColumnsAndValues(problems[0], ['timestamp', 'solvedDate']);
    if (columns.length === 0) {
      await db.run('COMMIT');
      return;
    }
    const placeholders = columns.map(() => '?').join(', ');
    const batchSize = Math.max(1, Math.floor(SQLITE_MAX_VARIABLES / columns.length));
    for (let i = 0; i < problems.length; i += batchSize) {
      const batch = problems.slice(i, i + batchSize);
      const multiRowPlaceholders = batch.map(() => `(${placeholders})`).join(',');
      const values = batch
        .map((problem) => {
          const { values } = getOjProblemColumnsAndValues(problem, ['timestamp', 'solvedDate']);
          return values;
        })
        .flat();
      await db.run(
        `INSERT INTO ${oj} (${columns.join(', ')})
         VALUES ${multiRowPlaceholders}`,
        values
      );
    }
    await db.run('COMMIT');
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
}
