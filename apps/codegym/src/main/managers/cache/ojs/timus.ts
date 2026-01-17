import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { TimusProblem } from '@common/schemas/problems';
import { OjMeta } from '@common/schemas/ojMeta';
import { type Database } from 'sqlite';
import { ojContexManager, ojMetaManager } from '@main/startup/instances';
import * as cheerio from 'cheerio';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

async function downloadTimusProblems() {
  const result = await fetch(
    'https://acm.timus.ru/problemset.aspx?space=1&page=all&skipac=False&sort=id'
  );
  const html = await result.text();
  const $ = cheerio.load(html);
  const problems: TimusProblem[] = [];
  const stats: OjMeta['timus']['stats'] = {
    difficulty: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: -Infinity,
    },
  };
  $('tr.content')
    .splice(1)
    .forEach((tr) => {
      const tds = $(tr).children('td');
      const newProblem: TimusProblem = {
        oj: 'timus',
        name: $(tds[2]).text().trim(),
        path: $(tds[1]).text().trim(),
        source: $(tds[3]).text().trim() || null,
        solved: parseInt($(tds[4]).text().trim()),
        difficulty: parseInt($(tds[5]).text().trim()),
        popularity: -1,
      };
      stats.difficulty.min = Math.min(stats.difficulty.min!, newProblem.difficulty);
      stats.difficulty.max = Math.max(stats.difficulty.max!, newProblem.difficulty);
      problems.push(newProblem);
    });
  stats.popularity.max = Math.floor((problems.length - 1) / POPULARITY_GROUP_SIZE) + 1;
  problems.sort((a, b) => {
    return a.solved < b.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
  };
}

async function replaceTimusProblems(db: Database, problems: TimusProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM timus');
    const stmt = await db.prepare(`
      INSERT INTO timus (
        name,
        path,
        solved,
        source,
        difficulty,
        popularity
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(
        p.name,
        p.path,
        p.solved,
        p.source, // Can be null.
        p.difficulty,
        p.popularity
      );
    }
    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

export async function filterTimusProblems(db: Database): Promise<TimusProblem[]> {
  const { filters } = ojContexManager.getContext()['timus'];
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

export async function updateTimusCache(db: Database): Promise<UpdateCacheResponseDTO<'timus'>> {
  const { problems, stats } = await downloadTimusProblems();
  await replaceTimusProblems(db, problems);
  const meta: OjMeta['timus'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  ojMetaManager.updateOjMeta('timus', meta);
  return {
    meta,
    status: 'success',
  };
}
