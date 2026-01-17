import { DATA_DIR } from '@main/constants';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { Oj } from '@common/schemas/oj';
import { setDbPragmas } from '@interapp/utils/sql';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { createCacheTables } from './helpers/tables';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';
import { updateCfCache } from './ojs/cf';
import { updateKattisCache } from './ojs/kattis';
import { updateLeetcodeCache } from './ojs/leetcode';
import { updateNepsCache } from './ojs/neps';
import { updateTimusCache } from './ojs/timus';
import { updateUvaCache } from './ojs/uva';

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

  // public filterOjProblems<T extends Oj>(oj: T): Promise<OjProblem[T][]> {
  //   if (!this.db) throw new Error('Cache DB not initialized!');
  //   return filterOjProblems(oj, this.db);
  // }
}
