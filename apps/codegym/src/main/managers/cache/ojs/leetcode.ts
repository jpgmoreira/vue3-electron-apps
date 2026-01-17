import { LeetcodeProblem } from '@common/schemas/problems';
import { LeetcodeResponseDTO } from '../dto/leetcodeResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { ojContexManager, ojMetaManager } from '@main/startup/instances';
import { type Database } from 'sqlite';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

async function downloadLeetcodeProblems() {
  const response = await fetch('https://leetcode.com/api/problems/all/');
  const json = (await response.json()) as LeetcodeResponseDTO;
  const problemset = json.stat_status_pairs;
  const problems: LeetcodeProblem[] = [];
  const stats: OjMeta['leetcode']['stats'] = {
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  problemset.forEach((p) => {
    const newProblem: LeetcodeProblem = {
      oj: 'leetcode',
      name: p.stat.question__title,
      path: p.stat.question__title_slug,
      accepted: p.stat.total_acs,
      submissions: p.stat.total_submitted,
      difficulty: p.difficulty.level,
      premium: p.paid_only,
      popularity: -1,
    };
    problems.push(newProblem);
  });
  problems.sort((a, b) => {
    return a.accepted < b.accepted ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
  };
}

async function replaceLeetCodeProblems(db: Database, problems: LeetcodeProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM leetcode');
    const stmt = await db.prepare(`
      INSERT INTO leetcode (
        name,
        path,
        accepted,
        difficulty,
        premium,
        popularity,
        submissions
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(
        p.name,
        p.path,
        p.accepted,
        p.difficulty,
        p.premium,
        p.popularity,
        p.submissions
      );
    }
    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

export async function filterLeetcodeProblems(db: Database): Promise<LeetcodeProblem[]> {
  const { filters } = ojContexManager.getContext()['leetcode'];
  const minp = filters.popularity.min;
  const maxp = filters.popularity.max;
  const premium = filters.premium.value;
  const difficulties = filters.difficulty.values
    .map((d: string) => {
      if (d === 'easy') return 1;
      if (d === 'medium') return 2;
      return 3;
    })
    .filter((x?: number) => x !== undefined);
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

export async function updateLeetcodeCache(
  db: Database
): Promise<UpdateCacheResponseDTO<'leetcode'>> {
  const { problems, stats } = await downloadLeetcodeProblems();
  await replaceLeetCodeProblems(db, problems);
  const meta: OjMeta['leetcode'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  ojMetaManager.updateOjMeta('leetcode', meta);
  return {
    status: 'success',
    meta,
  };
}
