import { getEmptyGraphRecord, GraphRecord } from '@common/schemas/graph';
import { DATA_DIR } from '@main/constants';
import path from 'path';
import { OjWithContests } from '@common/schemas/oj';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { setDbPragmas } from '@interapp/utils/sql';
import { createGraphTable, upsertGraphRecord } from './helpers/sql';

export class GraphManager {
  private db: Database | null = null;

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
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
