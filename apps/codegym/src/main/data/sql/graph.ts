import { GraphRecord } from '@common/schemas/graph';
import type { Database } from 'sqlite';

export async function createGraphTable(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER UNIQUE NOT NULL,
      cf INTEGER NOT NULL,
      neps INTEGER NOT NULL,
      leetcode INTEGER NOT NULL,
      timus INTEGER NOT NULL,
      uva INTEGER NOT NULL,
      kattis INTEGER NOT NULL,
      contests INTEGER NOT NULL
    );
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_graph_date ON graph (date);');
}

export async function upsertGraphRecord(db: Database, record: GraphRecord) {
  await db.run(
    `
    INSERT INTO graph (
      date, cf, neps, leetcode, timus, uva, kattis, contests
    ) VALUES (
      $date, $cf, $neps, $leetcode, $timus, $uva, $kattis, $contests
    )
    ON CONFLICT(date) DO UPDATE SET
      cf = excluded.cf,
      neps = excluded.neps,
      leetcode = excluded.leetcode,
      timus = excluded.timus,
      uva = excluded.uva,
      kattis = excluded.kattis,
      contests = excluded.contests
  `,
    {
      $date: record.date,
      $cf: record.cf,
      $neps: record.neps,
      $leetcode: record.leetcode,
      $timus: record.timus,
      $uva: record.uva,
      $kattis: record.kattis,
      $contests: record.contests,
    }
  );
}
