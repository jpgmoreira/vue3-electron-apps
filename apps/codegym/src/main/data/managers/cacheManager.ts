import { DATA_DIR } from '../constants';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { updateOjCache } from '../cache/update';
import { filterOjProblems } from '../cache/filter';
import { setDbPragmas } from '../utils';
import { createCacheTables } from '../sql/cache/cache';

/**
 * Singleton for managing cache.
 * Access via CacheManager.instance
 */
export class CacheManager {
  static #instance: CacheManager;

  private db: Database | null = null;

  private constructor() {}

  public async loadCache() {
    if (this.db) return;
    const filename = path.join(DATA_DIR, 'cache.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await createCacheTables(this.db);
  }

  public static get instance(): CacheManager {
    if (!this.#instance) {
      this.#instance = new CacheManager();
    }
    return this.#instance;
  }

  public updateOjCache<T extends Oj>(oj: T): Promise<OjMeta[T]> {
    return updateOjCache(oj, this.db!);
  }

  public filterOjProblems<T extends Oj>(oj: T): Promise<OjProblem[T][]> {
    return filterOjProblems(oj, this.db!);
  }
}
