type RangeStat = { min: number | null; max: number | null };
type MaxStat = { max: number | null };

export type OjMeta = {
  cf: {
    lastCacheUpdate: number | null;
    stats: {
      rating: RangeStat;
      popularity: MaxStat;
    };
    tags: string[];
  };
  neps: {
    lastCacheUpdate: number | null;
    stats: {
      score: RangeStat;
      popularity: MaxStat;
    };
  };
  leetcode: {
    lastCacheUpdate: number | null;
    stats: {
      popularity: MaxStat;
    };
  };
  timus: {
    lastCacheUpdate: number | null;
    stats: {
      difficulty: RangeStat;
      popularity: MaxStat;
    };
  };
  uva: {
    lastCacheUpdate: number | null;
    stats: {
      popularity: MaxStat;
    };
  };
  kattis: {
    lastCacheUpdate: number | null;
    stats: {
      difficulty: RangeStat;
      popularity: MaxStat;
    };
  };
};

export function getEmptyOjMeta(): OjMeta {
  return {
    cf: {
      lastCacheUpdate: null,
      stats: {
        rating: { min: null, max: null },
        popularity: { max: null },
      },
      tags: [],
    },
    neps: {
      lastCacheUpdate: null,
      stats: {
        score: { min: null, max: null },
        popularity: { max: null },
      },
    },
    leetcode: {
      lastCacheUpdate: null,
      stats: {
        popularity: { max: null },
      },
    },
    timus: {
      lastCacheUpdate: null,
      stats: {
        difficulty: { min: null, max: null },
        popularity: { max: null },
      },
    },
    uva: {
      lastCacheUpdate: null,
      stats: {
        popularity: { max: null },
      },
    },
    kattis: {
      lastCacheUpdate: null,
      stats: {
        difficulty: { min: null, max: null },
        popularity: { max: null },
      },
    },
  };
}
