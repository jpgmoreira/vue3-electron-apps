import { NepsProblem } from '@common/schemas/problems';
import { NepsResponseDTO } from '../dto/nepsResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { ojMetaManager } from '@main/startup/instances';
import { type Database } from 'sqlite';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

async function downloadNepsProblems() {
  const response = await fetch('https://api.neps.academy/tables/exercises?query');
  const json = (await response.json()) as NepsResponseDTO;
  const problemset = json.data;
  const problems: NepsProblem[] = [];
  const stats: OjMeta['neps']['stats'] = {
    score: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  problemset.forEach((p) => {
    const newProblem: NepsProblem = {
      oj: 'neps',
      name: p.title.value,
      path: p.id.toString(),
      score: p.score,
      solved: p.solved,
      popularity: -1,
    };
    problems.push(newProblem);
    if (newProblem.score != null) {
      stats.score.min = Math.min(stats.score.min!, newProblem.score);
      stats.score.max = Math.max(stats.score.max!, newProblem.score);
    }
  });
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

async function replaceNepsProblems(db: Database, problems: NepsProblem[]) {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM neps');
    const stmt = await db.prepare(`
      INSERT INTO neps (
        name,
        path,
        score,
        solved,
        popularity
      )
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const p of problems) {
      await stmt.run(
        p.name, // Can be null.
        p.path,
        p.score,
        p.solved,
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

export async function updateNepsCache(db: Database): Promise<UpdateCacheResponseDTO<'neps'>> {
  const { problems, stats } = await downloadNepsProblems();
  await replaceNepsProblems(db, problems);
  const meta: OjMeta['neps'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  ojMetaManager.updateOjMeta('neps', meta);
  return {
    status: 'success',
    meta,
  };
}
