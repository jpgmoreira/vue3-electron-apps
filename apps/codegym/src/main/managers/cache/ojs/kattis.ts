import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { KattisProblem } from '@common/schemas/problems';
import { OjMeta } from '@common/schemas/ojMeta';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { type Database } from 'sqlite';
import * as cheerio from 'cheerio';
import { replaceCacheProblems } from '@main/data/sql/cache/cache';

function parseTextDifficulty(text: string): number | null {
  /**
   * Converts the string representation of a Kattis problem difficulty to a float.
   * Floats properly represented as strings are just converted to floats.
   * "1.3 - 3.1" will be converted to 1.3 (get always the first value).
   * For any other case, null will be returned.
   */
  const val = parseFloat(text);
  return isNaN(val) ? null : val;
}

async function downloadKattisProblems() {
  // 1. Download all Kattis starred problems from Methods to Solve:
  let response = await fetch(
    'https://cpbook.net/methodstosolve?oj=kattis&topic=all&quality=starred'
  );
  let html = await response.text();
  let $ = cheerio.load(html);
  const starredProblems = new Set<string>();
  $('.Kattis.starred').each((_, e) => {
    starredProblems.add($(e).children('td').first().text().trim());
  });
  // 2. Download Kattis problemset:
  const problems: KattisProblem[] = [];
  const stats: OjMeta['kattis']['stats'] = {
    difficulty: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: -Infinity,
    },
  };
  for (let i = 0; ; i++) {
    response = await fetch(`https://open.kattis.com/problems?page=${i}`);
    html = await response.text();
    $ = cheerio.load(html);
    const trs = $('section[data-cy="problems-table"] tbody tr');
    if (trs.length === 0) break;
    trs.each((_, tr) => {
      const cols = $(tr).children('td').get();
      const textDifficulty = $(cols[6]).children('span').text().trim();
      const difficulty = parseTextDifficulty(textDifficulty);
      const newProblem: KattisProblem = {
        oj: 'kattis',
        name: $(cols[0]).text().trim(),
        path: $(cols[0]).children('a').first().attr('href')!.replace('/problems/', ''),
        solved: parseInt($(cols[4]).text()),
        submissions: parseInt($(cols[3]).text()),
        textDifficulty,
        difficulty,
        starred: false,
        popularity: -1,
      };
      newProblem.starred = starredProblems.has(newProblem.path);
      if (newProblem.difficulty !== null) {
        stats.difficulty.min = Math.min(stats.difficulty.min!, newProblem.difficulty);
        stats.difficulty.max = Math.max(stats.difficulty.max!, newProblem.difficulty);
      }
      problems.push(newProblem);
    });
  }
  problems.sort((a, b) => {
    return a.solved < b.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  stats.popularity = {
    max: Math.floor((problems.length - 1) / POPULARITY_GROUP_SIZE) + 1,
  };
  return {
    problems,
    stats,
  };
}

export async function updateKattisCache(db: Database): Promise<OjMeta['kattis']> {
  const { problems, stats } = await downloadKattisProblems();
  const meta: OjMeta['kattis'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('kattis', meta);
  await replaceCacheProblems(db, 'kattis', problems);
  return meta;
}
