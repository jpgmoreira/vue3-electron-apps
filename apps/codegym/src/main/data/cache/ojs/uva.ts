import { UvaProblem } from '@common/schemas/problems';
import * as cheerio from 'cheerio';
import { UvaResponseDTO } from '../dto/uvaResponseDTO';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { OjMeta } from '@common/schemas/ojMeta';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { type Database } from 'sqlite';
import { replaceCacheProblems } from '@main/data/sql/cache/cache';

async function downloadUvaProblems() {
  // 1. Download all UVA starred problems from Methods to Solve:
  let response = await fetch('https://cpbook.net/methodstosolve?oj=uva&topic=all&quality=starred');
  const html = await response.text();
  const $ = cheerio.load(html);
  const starredProblems = new Set<number>();
  $('.UVa.starred').each((_, e) => {
    starredProblems.add(parseInt($(e).children('td').first().text().trim()));
  });
  // 2. Download all UVA problems from the uHunt API:
  const problems: UvaProblem[] = [];
  response = await fetch('https://uhunt.onlinejudge.org/api/p');
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
    problems,
    stats,
  };
}

export async function updateUvaCache(db: Database): Promise<OjMeta['uva']> {
  const { problems, stats } = await downloadUvaProblems();
  const meta: OjMeta['uva'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('uva', meta);
  await replaceCacheProblems(db, 'uva', problems);
  return meta;
}
