import { LeetcodeProblem } from '@common/schemas/problems';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';

export async function filterLeetcodeProblems(db: Database): Promise<LeetcodeProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['leetcode'].filters;
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;
  const premium = filters.premium.value;
  const difficulties = filters.difficulty.values
    .map((d) => {
      if (d === 'easy') return 1;
      if (d === 'medium') return 2;
      return 3;
    })
    .filter((x) => x !== undefined);

  let sql = 'SELECT * FROM leetcode WHERE TRUE';

  const params: (string | number | boolean)[] = [];

  if (minp !== '') {
    sql += ' AND popularity >= ?';
    params.push(minp);
  }
  if (maxp !== '') {
    sql += ' AND popularity <= ?';
    params.push(maxp);
  }
  if (premium === 'yes') {
    sql += ' AND premium = ?';
    params.push(true);
  }
  if (premium === 'no') {
    sql += ' AND premium = ?';
    params.push(false);
  }
  if (difficulties.length) {
    sql += ` AND difficulty IN (${difficulties.join(',')})`;
  }

  const rows = await db.all<LeetcodeProblem[]>(sql, params);
  return rows;
}
