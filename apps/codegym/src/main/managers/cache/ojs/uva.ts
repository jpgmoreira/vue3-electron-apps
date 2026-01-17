import { UvaProblem } from '@common/schemas/problems';
import * as cheerio from 'cheerio';
import { UvaResponseDTO } from '../dto/uvaResponseDTO';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { OjMeta } from '@common/schemas/ojMeta';
import { ojContexManager, ojMetaManager } from '@main/startup/instances';
import { type Database } from 'sqlite';
import { Status } from '@interapp/types/status';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

async function downloadUvaProblems() {
  // 1. Download all UVA starred problems from Methods to Solve:
  const starredProblems = new Set<number>();
  let status: Status = 'success';
  let message = undefined as undefined | string;
  try {
    const response = await fetch(
      'https://cpbook.net/methodstosolve?oj=uva&topic=all&quality=starred'
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    $('.UVa.starred').each((_, e) => {
      starredProblems.add(parseInt($(e).children('td').first().text().trim()));
    });
  } catch (e) {
    status = 'info';
    message = 'Could not get starred problems from cpbook.net';
  }
  // 2. Download all UVA problems from the uHunt API:
  const problems: UvaProblem[] = [];
  const response = await fetch('https://uhunt.onlinejudge.org/api/p');
  const json = (await response.json()) as UvaResponseDTO;
  json.forEach((p) => {
    const newProblem: UvaProblem = {
      oj: 'uva',
      name: p[2],
      path: p[0].toString(),
      dacu: p[3],
      starred: starredProblems.has(p[1]),
      popularity: -1,
    };
    problems.push(newProblem);
  });
  problems.sort((a, b) => {
    return a.dacu < b.dacu ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  const stats: OjMeta['uva']['stats'] = {
    popularity: {
      max: Math.floor((problems.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  return {
    status,
    message,
    problems,
    stats,
  };
}

async function replaceUvaProblems(db: Database, problems: UvaProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM uva');
    const stmt = await db.prepare(`
      INSERT INTO uva (
        name,
        path,
        dacu,
        popularity,
        starred
      )
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(p.name, p.path, p.dacu, p.popularity, p.starred);
    }
    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

export async function filterUvaProblems(db: Database): Promise<UvaProblem[]> {
  const { filters } = ojContexManager.getContext()['uva'];
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

export async function updateUvaCache(db: Database): Promise<UpdateCacheResponseDTO<'uva'>> {
  const { problems, stats, message, status } = await downloadUvaProblems();
  await replaceUvaProblems(db, problems);
  const meta: OjMeta['uva'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  ojMetaManager.updateOjMeta('uva', meta);
  return {
    status,
    message,
    meta,
  };
}
