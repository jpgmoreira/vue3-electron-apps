/**
 * The properties "timestamp" and "solvedDate" are omitted ***only*** in the cache database to reduce storage usage.
 *
 * In the history tables, each problem snapshot has a manually generated "id".
 * In the cache tables, the "id" is automatically assigned by the database.
 *
 * The only moment when a problem has no "id" is during the short period between
 * being downloaded from the OJ and being inserted into the cache database.
 *
 * The "solvedDate" field is an integer in the format YYYYMMDD,
 * calculated based on the user's local time.
 */

import { Oj } from '@common/types/oj';
import { deepFreeze } from '@common/utils/utils';

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
  tags: string[];
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

/**
 * This is used to simplify SQL queries:
 */

type OjFields<T extends Oj> = {
  fields: Readonly<Array<keyof OjProblem[T]>>;
  jsonFields?: Readonly<Array<keyof OjProblem[T]>>;
  booleanFields?: Readonly<Array<keyof OjProblem[T]>>;
};

const baseFields = Object.freeze(['id', 'oj', 'name', 'path', 'solvedDate', 'timestamp'] as const);

export const OjFields = deepFreeze<{ [T in Oj]: OjFields<T> }>({
  cf: {
    fields: [...baseFields, 'solved', 'rating', 'popularity', 'tags'],
    jsonFields: ['tags'],
  },
  kattis: {
    fields: [
      ...baseFields,
      'solved',
      'submissions',
      'textDifficulty',
      'difficulty',
      'popularity',
      'starred',
    ],
    booleanFields: ['starred'],
  },
  neps: {
    fields: [...baseFields, 'score', 'solved', 'popularity'],
  },
  leetcode: {
    fields: [...baseFields, 'accepted', 'difficulty', 'premium', 'popularity', 'submissions'],
    booleanFields: ['premium'],
  },
  timus: {
    fields: [...baseFields, 'solved', 'source', 'difficulty', 'popularity'],
  },
  uva: {
    fields: [...baseFields, 'dacu', 'popularity', 'starred'],
    booleanFields: ['starred'],
  },
} as const);
