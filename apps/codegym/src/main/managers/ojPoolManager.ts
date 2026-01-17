import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjProblem } from '@common/schemas/problems';
import { Oj, OjList } from '@common/schemas/oj';
import { shuffleArray, toBase62 } from '@interapp/utils/utils';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { CacheManager } from './cache/cacheManager';
import { OjContextManager } from './ojContextManager';

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

export class OjPoolManager {
  private pool!: OjPoolType;
  private cacheManager: CacheManager;
  private ojContextManager: OjContextManager;

  constructor(
    emitter: EventEmitter,
    cacheManager: CacheManager,
    ojContextManager: OjContextManager
  ) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.cacheManager = cacheManager;
    this.ojContextManager = ojContextManager;
    this.clear();
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
    const context = this.ojContextManager.getContext()[oj];
    if (pool.dirty) {
      pool.shuffledProblems = await this.cacheManager.filterOjProblems(oj);
      shuffleArray(pool.shuffledProblems);
      context.matched = pool.shuffledProblems.length;
      pool.dirty = false;
      pool.index = 0;
    }
    const poolSize = pool.shuffledProblems.length;
    const snapshot = structuredClone(pool.shuffledProblems[pool.index] || null);
    if (snapshot) {
      const now = Date.now();
      snapshot.id = `snap-${oj}-${snapshot.path}-${toBase62(BigInt(now))}`;
      snapshot.timestamp = now;
      snapshot.solvedDate = null;
      // TODO:
      // HistoryManager.instance.insertIntoHistory(snapshot);
    }
    context.snapshot = snapshot;
    context.hasEverFiltered = true;
    this.ojContextManager.updateOjContext(oj, context);
    if (poolSize) {
      pool.index = (pool.index + 1) % poolSize;
    }
    result.snapshot = snapshot;
    result.matched = poolSize;
    return result;
  }

  public setDirty(oj: Oj) {
    this.pool[oj].dirty = true;
  }
}
