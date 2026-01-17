import { DATA_DIR } from '@main/constants';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { Oj } from '@common/schemas/oj';
import { setDbPragmas } from '@interapp/utils/sql';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { createCacheTables } from './helpers/tables';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';
import { filterCfProblems, updateCfCache } from './ojs/cf';
import { filterKattisProblems, updateKattisCache } from './ojs/kattis';
import { filterLeetcodeProblems, updateLeetcodeCache } from './ojs/leetcode';
import { filterNepsProblems, updateNepsCache } from './ojs/neps';
import { filterTimusProblems, updateTimusCache } from './ojs/timus';
import { filterUvaProblems, updateUvaCache } from './ojs/uva';
import { OjProblem } from '@common/schemas/problems';

export class CacheManager {
  private db: Database | null = null;

  private updateHandlers = Object.freeze({
    cf: updateCfCache,
    kattis: updateKattisCache,
    leetcode: updateLeetcodeCache,
    neps: updateNepsCache,
    timus: updateTimusCache,
    uva: updateUvaCache,
  }) satisfies {
    [T in Oj]: (db: Database) => Promise<UpdateCacheResponseDTO<T>>;
  };

  private filterHandlers = Object.freeze({
    cf: filterCfProblems,
    kattis: filterKattisProblems,
    leetcode: filterLeetcodeProblems,
    neps: filterNepsProblems,
    timus: filterTimusProblems,
    uva: filterUvaProblems,
  }) satisfies {
    [T in Oj]: (db: Database) => Promise<OjProblem[T][]>;
  };

  public async loadCache() {
    if (this.db) return;
    ensureDirExists(DATA_DIR);
    const filename = path.join(DATA_DIR, 'cache.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await createCacheTables(this.db);
  }

  public updateOjCache<T extends Oj>(oj: T): Promise<UpdateCacheResponseDTO<T>> {
    if (!this.db) throw new Error('Cache DB not initialized!');
    return this.updateHandlers[oj](this.db) as Promise<UpdateCacheResponseDTO<T>>;
  }

  public filterOjProblems<T extends Oj>(oj: T): Promise<OjProblem[T][]> {
    if (!this.db) throw new Error('Cache DB not initialized!');
    return this.filterHandlers[oj](this.db) as Promise<OjProblem[T][]>;
  }
}
