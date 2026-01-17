/**
 * The properties "timestamp" and "solvedDate" are absent only in the cache database,
 * to reduce storage usage and because they don't make sense there.
 *
 * In the history tables, each problem snapshot has a manually generated "id".
 * In the cache tables, the "id" is automatically assigned by the database.
 *
 * The only moment when a problem has no "id" is during the short period between
 * being downloaded from the OJ website and being inserted into the cache database.
 *
 * The "solvedDate" field is an integer in the format YYYYMMDD,
 * calculated based on the user's local time.
 */

import { Oj } from '@common/schemas/oj';

type BaseProblem = {
  id?: string;
  oj: Oj;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
};

export type CfProblem = BaseProblem & {
  oj: 'cf';
  solved: number;
  rating: number | null;
  popularity: number;
  tags: string;
};

export type KattisProblem = BaseProblem & {
  oj: 'kattis';
  solved: number;
  submissions: number;
  textDifficulty: string;
  difficulty: number | null;
  popularity: number;
  starred: boolean;
};

export type NepsProblem = BaseProblem & {
  oj: 'neps';
  score: number;
  solved: number;
  popularity: number;
};

export type LeetcodeProblem = BaseProblem & {
  oj: 'leetcode';
  accepted: number;
  difficulty: number;
  premium: boolean;
  popularity: number;
  submissions: number;
};

export type TimusProblem = BaseProblem & {
  oj: 'timus';
  solved: number;
  source: string | null;
  difficulty: number;
  popularity: number;
};

export type UvaProblem = BaseProblem & {
  oj: 'uva';
  dacu: number;
  popularity: number;
  starred: boolean;
};

export type OjProblem = {
  cf: CfProblem;
  kattis: KattisProblem;
  neps: NepsProblem;
  leetcode: LeetcodeProblem;
  timus: TimusProblem;
  uva: UvaProblem;
};
