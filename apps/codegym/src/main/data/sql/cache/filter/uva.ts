import { UvaProblem } from '@common/schemas/problems';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';

export async function filterUvaProblems(db: Database): Promise<UvaProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['uva'].filters;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;
  const starred = filters.starred.value;

  let sql = 'SELECT * FROM uva WHERE TRUE';

  const params: (string | number)[] = [];

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

  const rows = await db.all<UvaProblem[]>(sql, params);
  return rows;
}
