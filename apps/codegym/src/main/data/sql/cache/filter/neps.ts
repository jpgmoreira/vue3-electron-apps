import { NepsProblem } from '@common/schemas/problems';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';

export async function filterNepsProblems(db: Database): Promise<NepsProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['neps'].filters;
  const mins = filters.score.min;
  const maxs = filters.score.max;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;

  let sql = 'SELECT * FROM neps WHERE TRUE';

  const params: (string | number)[] = [];

  if (mins !== '') {
    sql += ' AND score >= ?';
    params.push(mins);
  }
  if (maxs !== '') {
    sql += ' AND score <= ?';
    params.push(maxs);
  }
  if (minp !== '') {
    sql += ' AND popularity >= ?';
    params.push(minp);
  }
  if (maxp !== '') {
    sql += ' AND popularity <= ?';
    params.push(maxp);
  }

  const rows = await db.all<NepsProblem[]>(sql, params);
  return rows;
}
