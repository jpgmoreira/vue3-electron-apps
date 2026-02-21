import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { getEmptySession, SessionsMap, Session } from '@common/schemas/session';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { arraysEqual, buildId, cloneDeep } from '@interapp/utils/utils';
import path from 'path';
import { Card } from '@common/schemas/card';
import { ProfileManager } from './profileManager';
import { CardsManager } from './cards/cardsManager';
import { setDbPragmas } from '@interapp/utils/sql';

export class SessionsManager {
  private db: Database | null = null;

  private sessionsMap: SessionsMap = {};

  private profileManager: ProfileManager;
  private cardsManager: CardsManager | null = null;

  constructor(profileManager: ProfileManager, emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.profileManager = profileManager;
  }

  private guard(db: Database | null): asserts db is Database {
    if (!db) throw new Error('Database not initialized');
  }

  public async loadProfile(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'sessions.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables();
    const records = (await this.db.all('SELECT * FROM sessions')) as Session[];
    for (const session of records) {
      this.sessionsMap[session.id] = session;
    }
  }

  private async createTables() {
    this.guard(this.db);
    await this.db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
  `);
  }

  public getSessionsMap() {
    return cloneDeep(this.sessionsMap);
  }

  public async createSession(n: number): Promise<Session> {
    this.guard(this.db);
    const now = Date.now();
    const name = `Session ${n}`;
    const id = buildId(name, now);
    const newSession = getEmptySession(id, name, now);
    this.sessionsMap[id] = newSession;
    await this.db.run(
      `INSERT INTO sessions (id, name, count, createdAt)
      VALUES (?, ?, ?, ?)`,
      [id, name, 0, now]
    );
    return newSession;
  }

  public async cardWasCreated(card: Card) {
    this.guard(this.db);
    for (const session of card.sessions) {
      await this.db.run('UPDATE sessions SET count = count + 1 WHERE id = ?', [session]);
      this.sessionsMap[session].count++;
    }
  }

  public async cardWasDeleted(card: Card) {
    this.guard(this.db);
    for (const session of card.sessions) {
      await this.db.run('UPDATE sessions SET count = count - 1 WHERE id = ?', [session]);
      this.sessionsMap[session].count--;
    }
  }

  public async cardWasUpdated(oldCard: Card, newCard: Card) {
    this.guard(this.db);
    if (arraysEqual(oldCard.sessions, newCard.sessions)) return;
    for (const session of oldCard.sessions) {
      await this.db.run('UPDATE sessions SET count = count - 1 WHERE id = ?', [session]);
      this.sessionsMap[session].count--;
    }
    for (const session of newCard.sessions) {
      await this.db.run('UPDATE sessions SET count = count + 1 WHERE id = ?', [session]);
      this.sessionsMap[session].count++;
    }
  }

  public async deleteSession(sessionId: string) {
    this.guard(this.db);
    if (!this.cardsManager) throw new Error('Cards manager not set!');
    this.profileManager.addSessions(-1);
    await this.cardsManager.sessionWasDeleted(sessionId);
    await this.db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
    delete this.sessionsMap[sessionId];
  }

  public setCardsManager(cardsManager: CardsManager) {
    this.cardsManager = cardsManager;
  }

  public async clear() {
    this.sessionsMap = {};
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
