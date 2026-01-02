import { KattisProblem } from '@common/schemas/problems';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';

export async function filterKattisProblems(db: Database): Promise<KattisProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['kattis'].filters;
  const mind = filters.difficulty.min;
  const maxd = filters.difficulty.max;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;
  const starred = filters.starred.value;

  let sql = 'SELECT * FROM kattis WHERE TRUE';

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
  if (starred) {
    sql += ' AND starred = TRUE';
  }

  const rows = await db.all<KattisProblem[]>(sql, params);
  return rows;
}
