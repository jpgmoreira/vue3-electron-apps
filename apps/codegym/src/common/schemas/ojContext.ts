import {
  CfProblem,
  KattisProblem,
  LeetcodeProblem,
  NepsProblem,
  TimusProblem,
  UvaProblem,
} from './problems';

type RangeFilter = { type: 'range'; min: '' | number; max: '' | number };
type BooleanFilter = { type: 'boolean'; value: boolean };
type AndArrayFilter = { type: 'and-array'; values: string[] };
type OrArrayFilter = { type: 'or-array'; values: string[] };
type YesNoBothFilter = { type: 'yes-no-both'; value: 'yes' | 'no' | 'both' };

export type OjContext = {
  cf: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: CfProblem | null;
    filters: {
      rating: RangeFilter;
      popularity: RangeFilter;
      tags: AndArrayFilter;
    };
  };
  kattis: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: KattisProblem | null;
    filters: {
      difficulty: RangeFilter;
      popularity: RangeFilter;
      starred: BooleanFilter;
    };
  };
  neps: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: NepsProblem | null;
    filters: {
      score: RangeFilter;
      popularity: RangeFilter;
    };
  };
  leetcode: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: LeetcodeProblem | null;
    filters: {
      difficulty: OrArrayFilter;
      popularity: RangeFilter;
      premium: YesNoBothFilter;
    };
  };
  timus: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: TimusProblem | null;
    filters: {
      difficulty: RangeFilter;
      popularity: RangeFilter;
    };
  };
  uva: {
    matched: number;
    hasEverFiltered: boolean;
    snapshot: UvaProblem | null;
    filters: {
      popularity: RangeFilter;
      starred: BooleanFilter;
    };
  };
};

export function getEmptyOjContext(): OjContext {
  return {
    cf: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        rating: { type: 'range', min: '', max: '' },
        popularity: { type: 'range', min: '', max: '' },
        tags: { type: 'and-array', values: [] },
      },
    },
    kattis: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        difficulty: { type: 'range', min: '', max: '' },
        popularity: { type: 'range', min: '', max: '' },
        starred: { type: 'boolean', value: false },
      },
    },
    neps: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        score: { type: 'range', min: '', max: '' },
        popularity: { type: 'range', min: '', max: '' },
      },
    },
    leetcode: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        difficulty: { type: 'or-array', values: [] },
        popularity: { type: 'range', min: '', max: '' },
        premium: { type: 'yes-no-both', value: 'both' },
      },
    },
    timus: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        difficulty: { type: 'range', min: '', max: '' },
        popularity: { type: 'range', min: '', max: '' },
      },
    },
    uva: {
      matched: 0,
      hasEverFiltered: false,
      snapshot: null,
      filters: {
        popularity: { type: 'range', min: '', max: '' },
        starred: { type: 'boolean', value: false },
      },
    },
  };
}
