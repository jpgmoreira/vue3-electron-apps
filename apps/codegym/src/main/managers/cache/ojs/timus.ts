import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { TimusProblem } from '@common/schemas/problems';
import { OjMeta } from '@common/schemas/ojMeta';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { type Database } from 'sqlite';
import * as cheerio from 'cheerio';
import { replaceCacheProblems } from '@main/data/sql/cache/cache';

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

export async function updateTimusCache(db: Database): Promise<OjMeta['timus']> {
  const { problems, stats } = await downloadTimusProblems();
  const meta: OjMeta['timus'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('timus', meta);
  await replaceCacheProblems(db, 'timus', problems);
  return meta;
}
