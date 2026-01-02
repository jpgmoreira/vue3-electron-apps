import { Oj } from '@common/types/oj';
import { OjProblem } from '@common/schemas/problems';
import { filterCfProblems } from '../sql/cache/filter/cf';
import { filterKattisProblems } from '../sql/cache/filter/kattis';
import { filterNepsProblems } from '../sql/cache/filter/neps';
import { filterUvaProblems } from '../sql/cache/filter/uva';
import { filterTimusProblems } from '../sql/cache/filter/timus';
import { filterLeetcodeProblems } from '../sql/cache/filter/leetcode';
import { Database } from 'sqlite';

const filterCacheFnMapping: {
  [K in Oj]: (db: Database) => Promise<OjProblem[K][]>;
} = {
  cf: filterCfProblems,
  kattis: filterKattisProblems,
  neps: filterNepsProblems,
  uva: filterUvaProblems,
  timus: filterTimusProblems,
  leetcode: filterLeetcodeProblems,
};

export async function filterOjProblems<T extends Oj>(oj: T, db: Database): Promise<OjProblem[T][]> {
  return filterCacheFnMapping[oj](db);
}
