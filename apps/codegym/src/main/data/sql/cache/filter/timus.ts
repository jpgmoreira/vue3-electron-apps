import { TimusProblem } from '@common/schemas/problems';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';

export async function filterTimusProblems(db: Database): Promise<TimusProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['timus'].filters;
  const mind = filters.difficulty.min;
  const maxd = filters.difficulty.max;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;

  let sql = 'SELECT * FROM timus WHERE TRUE';

  const params: (string | number)[] = [];

  if (mind !== '') {
    sql += ' AND difficulty >= ?';
    params.push(mind);
  }
  if (maxd !== '') {
    sql += ' AND difficulty <= ?';
    params.push(maxd);
  }
  if (minp !== '') {
    sql += ' AND popularity >= ?';
    params.push(minp);
  }
  if (maxp !== '') {
    sql += ' AND popularity <= ?';
    params.push(maxp);
  }

  const rows = await db.all<TimusProblem[]>(sql, params);
  return rows;
}
