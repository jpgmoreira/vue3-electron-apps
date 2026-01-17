import { OjProblem } from '@common/schemas/problems';
import { DATA_DIR } from '@main/constants';
import { Oj } from '@common/schemas/oj';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import { createHistoryTables } from './helpers/tables';
import { setDbPragmas } from '@interapp/utils/sql';

export class HistoryManager {
  private db: Database | null = null;

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
  }

  public async loadHistory(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'history.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await createHistoryTables(this.db);
  }

  public async fetchHistoryPage<T extends Oj>(
    oj: T,
    top: number
  ): Promise<FetchHistoryPageResponseDTO<T>> {
    if (!this.db) throw new Error('History DB not initialized!');
    return fetchHistoryPage(this.db, oj, top);
  }

  public async insertIntoHistory(problem: OjProblem[Oj]) {
    if (!this.db) throw new Error('History DB not initialized!');
    await insertIntoHistory(this.db, problem);
  }

  public async replaceHistorySnapshot(snapshot: OjProblem[Oj]) {
    if (!this.db) throw new Error('History DB not initialized!');
    await replaceHistorySnapshot(this.db, snapshot);
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
