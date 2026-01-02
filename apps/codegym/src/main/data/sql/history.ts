import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import { Oj } from '@common/types/oj';
import type { Database } from 'sqlite';
import { HISTORY_MAX_SIZE_PER_OJ, HISTORY_PAGE_SIZE } from '../constants';
import { OjFields, OjProblem } from '@common/schemas/problems';
import { getOjProblemColumnsAndValues } from '../utils';

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

export async function fetchHistoryPage<T extends Oj>(
  db: Database,
  oj: T,
  top: number
): Promise<FetchHistoryPageResponseDTO<T>> {
  const rows = await db.all<OjProblem[T][]>(
    `SELECT * FROM ${oj} ORDER BY timestamp DESC LIMIT $limit OFFSET $offset`,
    { $limit: HISTORY_PAGE_SIZE, $offset: top }
  );
  const totalRow = await db.get<{ total: number }>(`SELECT COUNT(*) as total FROM ${oj}`);
  const total = totalRow?.total ?? 0;
  const mapping = OjFields[oj];
  const data = rows.map((row) => {
    const fields: Partial<OjProblem[T]> = {};
    mapping.fields.forEach((f) => {
      let val = row[f] as unknown;
      if (typeof val === 'string') {
        if (mapping.jsonFields?.includes(f)) val = val && JSON.parse(val);
        if (mapping.booleanFields?.includes(f)) val = Boolean(val);
      }
      fields[f] = val as any;
    });
    return { ...fields, oj } as OjProblem[T];
  });
  return { data, total };
}

export async function insertIntoHistory<T extends Oj>(
  db: Database,
  problem: OjProblem[T]
): Promise<void> {
  const { columns, values } = getOjProblemColumnsAndValues(problem);
  const placeholders = columns.map((c) => `$${String(c)}`).join(', ');
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `INSERT INTO ${problem.oj} (${columns.join(', ')})
     VALUES (${placeholders})`,
      columns.reduce<Record<string, any>>((acc, col, i) => {
        acc[`$${String(col)}`] = values[i];
        return acc;
      }, {})
    );
    // Limit history size:
    const totalRow = await db.get<{ total: number }>(`SELECT COUNT(*) as total FROM ${problem.oj}`);
    const total = totalRow?.total ?? 0;
    const toDelete = total - HISTORY_MAX_SIZE_PER_OJ;
    if (toDelete > 0) {
      await db.run(
        `
      DELETE FROM ${problem.oj}
      WHERE id IN (
        SELECT id FROM ${problem.oj}
        ORDER BY timestamp ASC
        LIMIT ?
      )
    `,
        toDelete
      );
    }
    await db.run('COMMIT');
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
}

export async function replaceHistorySnapshot<T extends Oj>(db: Database, snapshot: OjProblem[T]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`DELETE FROM ${snapshot.oj} WHERE id = $id`, { $id: snapshot.id });
    const { columns, values } = getOjProblemColumnsAndValues(snapshot);
    const placeholders = columns.map((col) => `$${String(col)}`).join(', ');
    const params: Record<string, any> = {};
    columns.forEach((col, i) => {
      params[`$${String(col)}`] = values[i];
    });
    await db.run(
      `INSERT INTO ${snapshot.oj} (${columns.join(', ')}) VALUES (${placeholders})`,
      params
    );
    await db.run('COMMIT');
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
}
