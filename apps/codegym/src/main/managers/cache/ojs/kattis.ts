import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { KattisProblem } from '@common/schemas/problems';
import { OjMeta } from '@common/schemas/ojMeta';
import { ojContexManager, ojMetaManager } from '@main/startup/instances';
import { type Database } from 'sqlite';
import * as cheerio from 'cheerio';
import { Status } from '@interapp/types/status';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

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
  const starredProblems = new Set<string>();
  let status: Status = 'success';
  let message = undefined as undefined | string;
  try {
    const response = await fetch(
      'https://cpbook.net/methodstosolve?oj=kattis&topic=all&quality=starred'
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    $('.Kattis.starred').each((_, e) => {
      starredProblems.add($(e).children('td').first().text().trim());
    });
  } catch (e) {
    status = 'warning';
    message = 'Could not get starred problems from cpbook.net';
  }
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
    const response = await fetch(`https://open.kattis.com/problems?page=${i}`);
    const html = await response.text();
    const $ = cheerio.load(html);
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
    status,
    message,
    problems,
    stats,
  };
}

async function replaceKattisProblems(db: Database, problems: KattisProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM kattis');
    const stmt = await db.prepare(`
      INSERT INTO kattis (
        name,
        path,
        solved,
        submissions,
        textDifficulty,
        difficulty,
        popularity,
        starred
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(
        p.name,
        p.path,
        p.solved,
        p.submissions,
        p.textDifficulty,
        p.difficulty,
        p.popularity,
        p.starred
      );
    }
    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

export async function filterKattisProblems(db: Database): Promise<KattisProblem[]> {
  const { filters } = ojContexManager.getContext()['kattis'];
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

export async function updateKattisCache(db: Database): Promise<UpdateCacheResponseDTO<'kattis'>> {
  const { problems, stats, status, message } = await downloadKattisProblems();
  await replaceKattisProblems(db, problems);
  const meta: OjMeta['kattis'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  ojMetaManager.updateOjMeta('kattis', meta);
  return {
    status,
    message,
    meta,
  };
}
