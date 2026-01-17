import { CfProblem } from '@common/schemas/problems';
import { CfResponseDTO } from '../dto/cfResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import type { Database } from 'sqlite';
import { ojContexManager, ojMetaManager } from '@main/startup/instances';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

async function downloadCfProblems() {
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const json = (await response.json()) as CfResponseDTO;
  const problemset = json.result.problems;
  const problemStatistics = json.result.problemStatistics;
  const problems: CfProblem[] = [];
  const stats: OjMeta['cf']['stats'] = {
    rating: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  const tagsSet = new Set<string>();
  for (let i = 0; i < problemset.length; i++) {
    let contestId = problemset[i].contestId;
    if (contestId === undefined) contestId = problemStatistics[i].contestId;
    let index = problemset[i].index;
    if (index === undefined) index = problemStatistics[i].index;
    const path = `${contestId}/${index}`;
    const newProblem: CfProblem = {
      oj: 'cf',
      name: problemset[i].name,
      path,
      rating: problemset[i].rating || null,
      tags: JSON.stringify(problemset[i].tags),
      solved: problemStatistics[i].solvedCount,
      popularity: -1,
    };
    if (newProblem.rating != null) {
      stats.rating.min = Math.min(stats.rating.min!, newProblem.rating);
      stats.rating.max = Math.max(stats.rating.max!, newProblem.rating);
    }
    problemset[i].tags.forEach((t) => tagsSet.add(t.toLowerCase()));
    problems.push(newProblem);
  }
  problems.sort((a, b) => {
    return a.solved < b.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
    tags: Array.from(tagsSet),
  };
}

async function replaceCfProblems(db: Database, problems: CfProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM cf');
    const stmt = await db.prepare(`
      INSERT INTO cf (name, path, solved, rating, popularity, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(p.name, p.path, p.solved, p.rating, p.popularity, JSON.stringify(p.tags));
    }
    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

export async function filterCfProblems(db: Database): Promise<CfProblem[]> {
  const { filters } = ojContexManager.getContext()['cf'];
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
  return rows;
}

export async function updateCfCache(db: Database): Promise<UpdateCacheResponseDTO<'cf'>> {
  const { problems, stats, tags } = await downloadCfProblems();
  await replaceCfProblems(db, problems);
  const meta: OjMeta['cf'] = {
    lastCacheUpdate: Date.now(),
    stats,
    tags,
  };
  ojMetaManager.updateOjMeta('cf', meta);
  return {
    status: 'success',
    meta,
  };
}
