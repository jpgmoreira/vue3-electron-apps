import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';
import { CfProblem } from '@common/schemas/problems';

export async function filterCfProblems(db: Database): Promise<CfProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['cf'].filters;
  const tags = filters.tags.values;
  const minr = filters.rating.min;
  const maxr = filters.rating.max;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;

  let sql = 'SELECT * FROM cf WHERE TRUE';

  const params: (string | number)[] = [];

  if (minr !== '') {
    sql += ' AND rating >= ?';
    params.push(minr);
  }
  if (maxr !== '') {
    sql += ' AND rating <= ?';
    params.push(maxr);
  }
  if (minp !== '') {
    sql += ' AND popularity >= ?';
    params.push(minp);
  }
  if (maxp !== '') {
    sql += ' AND popularity <= ?';
    params.push(maxp);
  }

  if (tags.length > 0) {
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i].toLowerCase();
      sql += ' AND tags LIKE ?';
      params.push(`%\"${tag}\"%`);
    }
  }

  const rows = await db.all<CfProblem[]>(sql, params);
  for (const row of rows) {
    if (row.tags) {
      row.tags = JSON.parse(row.tags as unknown as string);
    }
  }
  return rows;
}
