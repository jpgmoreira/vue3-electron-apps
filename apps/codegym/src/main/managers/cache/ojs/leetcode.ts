import { LeetcodeProblem } from '@common/schemas/problems';
import { LeetcodeResponseDTO } from '../dto/leetcodeResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { type Database } from 'sqlite';
import { replaceCacheProblems } from '@main/data/sql/cache/cache';

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

export async function updateLeetcodeCache(db: Database): Promise<OjMeta['leetcode']> {
  const { problems, stats } = await downloadLeetcodeProblems();
  const meta: OjMeta['leetcode'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('leetcode', meta);
  await replaceCacheProblems(db, 'leetcode', problems);
  return meta;
}
