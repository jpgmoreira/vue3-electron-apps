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
import { HISTORY_MAX_SIZE_PER_OJ, HISTORY_PAGE_SIZE } from '@common/constants';

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

  private guard(db: Database | null): asserts db is Database {
    if (!db) throw new Error('History DB not initialized!');
  }

  public async fetchHistoryPage<T extends Oj>(
    oj: T,
    top: number
  ): Promise<FetchHistoryPageResponseDTO<T>> {
    this.guard(this.db);
    const data = await this.db.all<OjProblem[T][]>(
      `SELECT * FROM ${oj} ORDER BY timestamp DESC LIMIT $limit OFFSET $offset`,
      { $limit: HISTORY_PAGE_SIZE, $offset: top }
    );
    const totalRow = await this.db.get<{ total: number }>(`SELECT COUNT(*) as total FROM ${oj}`);
    const total = totalRow?.total ?? 0;
    return { data, total };
  }

  public async insertIntoHistory(problem: OjProblem[Oj]) {
    this.guard(this.db);
    await this.db.run('BEGIN TRANSACTION');
    try {
      const columns = Object.keys(problem);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((c) => problem[c]);
      await this.db.run(
        `INSERT INTO ${problem.oj} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      // Limit history size:
      const totalRow = await this.db.get<{ total: number }>(
        `SELECT COUNT(*) as total FROM ${problem.oj}`
      );
      const total = totalRow?.total ?? 0;
      const toDelete = total - HISTORY_MAX_SIZE_PER_OJ;
      if (toDelete > 0) {
        await this.db.run(
          `
          DELETE FROM ${problem.oj}
          WHERE id IN (
            SELECT id FROM ${problem.oj}
            ORDER BY timestamp ASC
            LIMIT ?
          )
        `,
          toDelete
        );
      }
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      throw err;
    }
  }

  public async replaceHistorySnapshot(snapshot: OjProblem[Oj]) {
    this.guard(this.db);
    await this.db.run('BEGIN TRANSACTION');
    try {
      const columns = Object.keys(snapshot);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((c) => (snapshot as any)[c]);
      await this.db.run(`DELETE FROM ${snapshot.oj} WHERE id = ?`, snapshot.id);
      await this.db.run(
        `INSERT INTO ${snapshot.oj} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      throw err;
    }
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
