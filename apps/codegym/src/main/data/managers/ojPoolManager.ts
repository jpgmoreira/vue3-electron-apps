import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjProblem } from '@common/schemas/problems';
import { Oj, OjList } from '@common/types/oj';
import { ProfileManager } from './profileManager';
import { CacheManager } from './cacheManager';
import { shuffleArray, toBase62 } from '@common/utils/utils';
import { HistoryManager } from './historyManager';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/utils/events';

EventEmitter.instance.on(Events.clearProfileData, () => {
  OjPoolManager.instance.clear();
});

type OjPoolType = {
  [K in Oj]: {
    // Information if you must filter new problems for the OJ.
    dirty: boolean;
    // Filtered problems shuffled.
    shuffledProblems: OjProblem[K][];
    // Index of the current problem in the shuffled problems array.
    index: number;
  };
};

/**
 * Singleton for managing the pool of currently filtered OJ problems.
 * Access via OjPoolManager.instance
 */
export class OjPoolManager {
  static #instance: OjPoolManager;
  private pool!: OjPoolType;

  private constructor() {
    this.clear();
  }

  public static get instance(): OjPoolManager {
    if (!this.#instance) {
      this.#instance = new OjPoolManager();
    }
    return this.#instance;
  }

  public clear() {
    this.pool = OjList.reduce<OjPoolType>((acc, oj) => {
      acc[oj] = {
        dirty: true,
        shuffledProblems: [],
        index: 0,
      };
      return acc;
    }, {} as OjPoolType);
  }

  public async getOjProblem<T extends Oj>(oj: T) {
    const result: GetOjProblemResponseDTO<T> = {
      snapshot: null,
      matched: 0,
    };
    const pool = this.pool[oj];
    if (pool.dirty) {
      pool.shuffledProblems = await CacheManager.instance.filterOjProblems(oj);
      shuffleArray(pool.shuffledProblems);
      ProfileManager.instance.setOjContextMatched(oj, pool.shuffledProblems.length);
      pool.dirty = false;
      pool.index = 0;
    }
    const poolSize = pool.shuffledProblems.length;
    const snapshot = structuredClone(pool.shuffledProblems[pool.index] || null);
    if (snapshot) {
      const now = Date.now();
      snapshot.id = `snap-${oj}-${snapshot.path}-${toBase62(now)}`;
      snapshot.timestamp = now;
      snapshot.solvedDate = null;
      HistoryManager.instance.insertIntoHistory(snapshot);
    }
    ProfileManager.instance.setOjContextSnapshot(oj, snapshot);
    if (poolSize) {
      pool.index = (pool.index + 1) % poolSize;
    }
    ProfileManager.instance.setOjContextHasEverFiltered(oj, true);
    result.snapshot = snapshot;
    result.matched = poolSize;
    return result;
  }

  public setDirty(oj: Oj) {
    this.pool[oj].dirty = true;
  }
}
