import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Card, CardFrequency, DBCard } from '@common/schemas/card';
import path from 'path';
import { setDbPragmas } from '@interapp/utils/sql';
import { DATA_DIR } from '@main/constants';

export class CardsDbManager {
  private db: Database | null = null;

  public async loadProfile(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'cards.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables(this.db);
  }

  private async createTables(db: Database) {
    await db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      front TEXT NOT NULL,
      back TEXT NOT NULL DEFAULT '',
      extra TEXT NOT NULL DEFAULT '',
      media TEXT NOT NULL,
      allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt INTEGER NOT NULL,
      lastReviewedAt INTEGER,
      sessions TEXT NOT NULL,
      tags TEXT NOT NULL,
      frequency TEXT NOT NULL,
      bucket BOOLEAN NOT NULL DEFAULT FALSE,
      height INTEGER NOT NULL
    );
  `);
  }

  public async loadAllCards(): Promise<Card[]> {
    if (!this.db) throw new Error('Db not initialized');
    const result = (await this.db.all('SELECT * FROM cards')) as DBCard[];
    return result.map(this.deserializeCard);
  }

  private serializeCard(card: Card): DBCard {
    const result = {
      ...card,
      tags: JSON.stringify(card.tags),
      sessions: JSON.stringify(card.sessions),
      media: JSON.stringify(card.media),
    };
    return result;
  }

  private deserializeCard(card: DBCard): Card {
    const result = {
      ...card,
      tags: JSON.parse(card.tags),
      sessions: JSON.parse(card.sessions),
      media: JSON.parse(card.media),
    } as Card;
    return result;
  }

  public async insertCard(card: Card) {
    if (!this.db) throw new Error('Db not initialized');
    const serialized = this.serializeCard(card);
    await this.db.run(
      `
      INSERT INTO cards (
        id, front, back, extra, media, allowReversed, createdAt,
        lastReviewedAt, sessions, tags, frequency, bucket, height
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        serialized.id,
        serialized.front,
        serialized.back,
        serialized.extra,
        serialized.media,
        serialized.allowReversed,
        serialized.createdAt,
        serialized.lastReviewedAt,
        serialized.sessions,
        serialized.tags,
        serialized.frequency,
        serialized.bucket,
        serialized.height,
      ]
    );
  }

  public async updateCard(card: Card) {
    if (!this.db) throw new Error('Db not initialized');
    const serialized = this.serializeCard(card);
    await this.db.run(
      `
      UPDATE cards SET
        front = ?, back = ?, extra = ?, media = ?, allowReversed = ?,
        createdAt = ?, lastReviewedAt = ?, sessions = ?, tags = ?,
        frequency = ?, bucket = ?, height = ?
      WHERE id = ?
    `,
      [
        serialized.front,
        serialized.back,
        serialized.extra,
        serialized.media,
        serialized.allowReversed,
        serialized.createdAt,
        serialized.lastReviewedAt,
        serialized.sessions,
        serialized.tags,
        serialized.frequency,
        serialized.bucket,
        serialized.height,
        serialized.id,
      ]
    );
  }

  public async deleteCard(cardId: string) {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('DELETE FROM cards WHERE id = ?', [cardId]);
  }

  public async clearFilteredBucket(filtered: Card[]) {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('BEGIN TRANSACTION');
    try {
      const stmt = await this.db.prepare('UPDATE cards SET bucket = FALSE WHERE id = ?');
      for (const card of filtered) {
        if (card.bucket) {
          await stmt.run([card.id]);
        }
      }
      await stmt.finalize();
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      console.error('Failed clearing bucket:', err);
    }
  }

  public async clearFilteredFrequency(filtered: Card[], frequency: CardFrequency) {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('BEGIN TRANSACTION');
    try {
      const stmt = await this.db.prepare(`
        UPDATE cards
        SET frequency = 'normal'
        WHERE id = ?
      `);
      for (const card of filtered) {
        if (card.frequency === frequency) {
          await stmt.run([card.id]);
        }
      }
      await stmt.finalize();
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      console.error('Failed clearing frequency:', err);
    }
  }

  // -- Externally managed transactions: use with caution! ---

  public async beginTransaction() {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('BEGIN TRANSACTION');
  }

  public async commit() {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('COMMIT');
  }

  public async rollback() {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('ROLLBACK');
  }

  // ---

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
