import { DATA_DIR } from '@main/constants';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/schemas/oj';
import { setDbPragmas } from '@interapp/utils/sql';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { createCacheTables } from './sql/tables';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

export class CacheManager {
  private db: Database | null = null;

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
    return updateOjCache(oj, this.db);
  }

  // public filterOjProblems<T extends Oj>(oj: T): Promise<OjProblem[T][]> {
  //   if (!this.db) throw new Error('Cache DB not initialized!');
  //   return filterOjProblems(oj, this.db);
  // }
}
