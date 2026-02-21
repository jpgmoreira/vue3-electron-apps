import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { setDbPragmas } from '@interapp/utils/sql';
import { GraphRecord } from '@common/schemas/graph';
import { getTodayDate } from '@interapp/utils/dateUtils';

export class GraphManager {
  private db: Database | null = null;

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
  }

  public async loadProfile(profileId: string): Promise<GraphRecord[]> {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'graph.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables();
    const result = await this.db.all('SELECT * FROM graph ORDER BY date');
    return result as GraphRecord[];
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.exec(`
    CREATE TABLE IF NOT EXISTS graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER UNIQUE NOT NULL,
      minutes INTEGER NOT NULL DEFAULT 0
    );
  `);
  }

  public async incrementTodayRecord(): Promise<GraphRecord> {
    if (!this.db) throw new Error('Database not initialized');
    const todayDate = getTodayDate();
    const record = (await this.db.get(
      `INSERT INTO graph (date, minutes) VALUES (?, 1)
       ON CONFLICT(date) DO UPDATE SET minutes = minutes + 1
       RETURNING *`,
      todayDate
    )) as GraphRecord;
    return record;
  }

  private async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
