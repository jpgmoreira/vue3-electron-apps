import { OjProblem } from '@common/schemas/problems';
import { DATA_DIR } from '../constants';
import { Oj } from '@common/types/oj';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/utils/events';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import {
  createHistoryTables,
  fetchHistoryPage,
  insertIntoHistory,
  replaceHistorySnapshot,
} from '../sql/history';
import { setDbPragmas } from '../utils';

EventEmitter.instance.on(Events.clearProfileData, () => {
  HistoryManager.instance.clear();
});

/**
 * Singleton for managing history data.
 * Access via HistoryManager.instance
 */
export class HistoryManager {
  static #instance: HistoryManager;

  private db: Database | null = null;

  private constructor() {}

  public static get instance(): HistoryManager {
    if (!this.#instance) {
      this.#instance = new HistoryManager();
    }
    return this.#instance;
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
    if (!this.db) {
      return {
        data: [],
        total: 0,
      };
    }
    return fetchHistoryPage(this.db, oj, top);
  }

  public async insertIntoHistory(problem: OjProblem[Oj]) {
    if (!this.db) return;
    await insertIntoHistory(this.db, problem);
  }

  public async replaceHistorySnapshot(snapshot: OjProblem[Oj]) {
    if (!this.db) return;
    await replaceHistorySnapshot(this.db, snapshot);
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
