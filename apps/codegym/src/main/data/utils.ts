import { OjFields, OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';
import fs from 'fs';
import type { Database } from 'sqlite';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export async function setDbPragmas(db: Database) {
  await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA foreign_keys = ON;
    `);
}

/**
 * Returns all columns and values for an OJ problem, with JSON and boolean handling.
 * Optionally excludes specific columns (e.g. ["timestamp", "solvedDate"]).
 */
export function getOjProblemColumnsAndValues<T extends Oj>(
  problem: OjProblem[T],
  exclude: string[] = []
) {
  const oj = problem.oj as T;
  const mapping = OjFields[oj];
  const allColumns = mapping.fields;
  const columns = allColumns.filter((col) => !exclude.includes(String(col)));
  const values = columns.map((col) => {
    const key = col as keyof typeof problem;
    const val = problem[key];
    if (mapping.jsonFields?.includes(key)) return JSON.stringify(val);
    if (mapping.booleanFields?.includes(key)) return val ? 1 : 0;
    return val;
  });
  return { columns, values };
}
