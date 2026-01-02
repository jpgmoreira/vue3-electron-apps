import { getEmptyGraphRecord, GraphRecord } from '@common/schemas/graph';
import { DATA_DIR } from '../constants';
import path from 'path';
import { OjWithContests } from '@common/types/oj';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/utils/events';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { createGraphTable, upsertGraphRecord } from '../sql/graph';
import { setDbPragmas } from '../utils';

EventEmitter.instance.on(Events.clearProfileData, () => {
  GraphManager.instance.clear();
});

/**
 * Singleton for managing graph data.
 * Access via GraphManager.instance
 */
export class GraphManager {
  static #instance: GraphManager;

  private db: Database | null = null;

  private constructor() {}

  public static get instance(): GraphManager {
    if (!this.#instance) {
      this.#instance = new GraphManager();
    }
    return this.#instance;
  }

  public async loadGraph(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'graph.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await createGraphTable(this.db);
  }

  public async getGraphData(): Promise<GraphRecord[]> {
    if (!this.db) return [];
    return this.db.all<GraphRecord[]>('SELECT * FROM graph ORDER BY date');
  }

  public async updateGraph(source: OjWithContests, date: number, value: -1 | 1) {
    if (!this.db) return;
    let record = await this.db.get<GraphRecord>('SELECT * FROM graph WHERE date = ?', date);
    if (!record) {
      record = getEmptyGraphRecord(date);
    }
    record[source] += value;
    await upsertGraphRecord(this.db, record);
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
