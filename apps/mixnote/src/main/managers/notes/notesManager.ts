import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import fs from 'fs';
import {
  getEmptyNote,
  getEmptyPersistentNote,
  Note,
  NoteFrequency,
  PersistentNote,
} from '@common/schemas/notes';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { ProfileManager } from '../profileManager';
import { TabsManager } from '../tabsManager';
import { NotesMediaManager } from './media/notesMediaManager';
import { FlashcardsManager } from './flashcardsManager';
import { BooleanMap, FrequencyMap, TimestampMap } from '@common/schemas/maps';
import { FileProxy } from '@interapp/utils/fileProxy';
import { Statistics } from '@common/schemas/statistics';
import { ExplorerManager } from '@interapp/components/Explorer/main/explorerManager';
import { Filters, getEmptyFilters } from '@common/schemas/filters';
import { cloneDeep } from '@interapp/utils/utils';
import { setDbPragmas } from '@interapp/utils/sql';
import { Meta } from '@common/schemas/meta';

export class NotesManager {
  private db: Database | null = null;

  private profileId: string | null = null;
  private profileManager: ProfileManager;
  private tabsManager: TabsManager;
  private mediaManager: NotesMediaManager;
  private flashcardsManager: FlashcardsManager;
  private explorerManager: ExplorerManager;

  private lastReviewedAt: TimestampMap = {};
  private frequencies: FrequencyMap = {};
  private bucket: BooleanMap = {};

  private filters: FileProxy<Filters> | null = null;

  private filtered: string[] = [];

  constructor(
    emitter: EventEmitter,
    profileManager: ProfileManager,
    tabsManager: TabsManager,
    mediaManager: NotesMediaManager,
    flashcardsManager: FlashcardsManager,
    explorerManager: ExplorerManager
  ) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.profileManager = profileManager;
    this.tabsManager = tabsManager;
    this.mediaManager = mediaManager;
    this.flashcardsManager = flashcardsManager;
    this.explorerManager = explorerManager;
  }

  private guard(noteId: string) {
    if (!this.profileId) throw new Error('Profile not initialized.');
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', noteId);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Note does not exist!: ${noteId}`);
    }
    return dirPath;
  }

  private guardDb(db: Database | null): asserts db is Database {
    if (!db) throw new Error('Database not initialized');
  }

  public async loadProfile(profileId: string) {
    await this.clear();
    this.profileId = profileId;
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId);
    const filtersPath = path.join(dirPath, 'filters.json');
    const filename = path.join(dirPath, 'meta.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables();
    const records = (await this.db.all('SELECT * FROM meta')) as Meta[];
    for (const record of records) {
      this.lastReviewedAt[record.noteId] = record.lastReviewedAt;
      this.frequencies[record.noteId] = record.frequency;
      this.bucket[record.noteId] = Boolean(record.bucket);
    }
    this.filters = new FileProxy(filtersPath, getEmptyFilters());
    this.flashcardsManager.setMaps(this.lastReviewedAt, this.frequencies);
  }

  private async createTables() {
    this.guardDb(this.db);
    await this.db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      noteId TEXT PRIMARY KEY,
      lastReviewedAt INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      bucket BOOLEAN NOT NULL
    );
  `);
  }

  public async createNote(name: string): Promise<Note> {
    if (!this.profileId) throw new Error('Profile not initialized.');
    this.guardDb(this.db);
    const now = Date.now();
    const note = getEmptyNote(name, now);
    const persistent = getEmptyPersistentNote(name, now);
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    fs.writeFileSync(fPath, JSON.stringify(persistent), 'utf-8');
    this.lastReviewedAt[note.id] = now;
    this.frequencies[note.id] = note.frequency;
    this.bucket[note.id] = note.bucket;
    await this.db.run(
      `INSERT INTO meta (noteId, lastReviewedAt, frequency, bucket)
      VALUES (?, ?, ?, ?)`,
      [note.id, now, note.frequency, note.bucket]
    );
    return note;
  }

  public async deleteNote(noteId: string) {
    this.guardDb(this.db);
    const dirPath = this.guard(noteId);
    fs.rmSync(dirPath, { recursive: true, force: true });
    this.profileManager.addNotes(-1);
    this.tabsManager.noteWasDeleted(noteId);
    delete this.lastReviewedAt[noteId];
    delete this.frequencies[noteId];
    delete this.bucket[noteId];
    await this.db.run('DELETE FROM meta WHERE noteId = ?', [noteId]);
  }

  public getNote(noteId: string): Note {
    const dirPath = this.guard(noteId);
    const notePath = path.join(dirPath, `${noteId}.json`);
    const persistent = JSON.parse(fs.readFileSync(notePath, 'utf-8')) as PersistentNote;
    let note: Note = {
      ...persistent,
      bucket: this.bucket[noteId],
      frequency: this.frequencies[noteId],
    };
    note = this.mediaManager.preparePaths(note, dirPath);
    return note;
  }

  private atomicallyUpdateNote(note: Note) {
    const dirPath = this.guard(note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    const tmpPath = path.join(dirPath, `${note.id}.json.tmp`);
    const { frequency, bucket, ...persistent } = note;
    fs.writeFileSync(tmpPath, JSON.stringify(persistent), 'utf-8');
    if (fs.existsSync(fPath)) fs.rmSync(fPath);
    fs.renameSync(tmpPath, fPath);
  }

  public async updateNote(note: Note) {
    if (!this.profileId) throw new Error('Profile not initialized.');
    this.guardDb(this.db);
    await this.mediaManager.noteWasUpdated(note, this.profileId);
    this.atomicallyUpdateNote(note);
    if (note.frequency !== this.frequencies[note.id]) {
      this.frequencies[note.id] = note.frequency;
      await this.db.run('UPDATE meta SET frequency = ? WHERE noteId = ?', [
        note.frequency,
        note.id,
      ]);
    }
    if (note.bucket !== this.bucket[note.id]) {
      this.bucket[note.id] = note.bucket;
      await this.db.run('UPDATE meta SET bucket = ? WHERE noteId = ?', [note.bucket, note.id]);
    }
  }

  public async getFlashcard(noteId: string | null): Promise<Note | null> {
    if (noteId) return this.getNote(noteId);
    this.guardDb(this.db);
    const nextId = this.flashcardsManager.getNextFlashcard();
    if (!nextId) return null;
    const now = Date.now();
    this.lastReviewedAt[nextId] = now;
    await this.db.run('UPDATE meta SET lastReviewedAt = ? WHERE noteId = ?', [now, nextId]);
    return this.getNote(nextId);
  }

  public getStatistics(): Statistics {
    this.filter();
    const frequencies = this.frequencies;
    const bucket = this.bucket;
    const total = Object.keys(frequencies).length;
    const totalBucket = Object.values(bucket).filter(Boolean).length;
    const totalLow = Object.values(frequencies).filter((v) => v === 'low').length;
    const totalHigh = Object.values(frequencies).filter((v) => v === 'high').length;
    const totalNormal = Object.values(frequencies).filter((v) => v === 'normal').length;
    const filtered = this.filtered.length;
    const filteredBucket = this.filtered.filter((v) => bucket[v]).length;
    const filteredLow = this.filtered.filter((v) => frequencies[v] === 'low').length;
    const filteredHigh = this.filtered.filter((v) => frequencies[v] === 'high').length;
    const filteredNormal = this.filtered.filter((v) => frequencies[v] === 'normal').length;
    return {
      total,
      totalBucket,
      totalLow,
      totalHigh,
      totalNormal,
      filtered,
      filteredBucket,
      filteredLow,
      filteredHigh,
      filteredNormal,
    };
  }

  private filter() {
    if (!this.filters) throw new Error('Filters not set!');
    const filters = this.filters.target;
    const allIds = new Set(Object.keys(this.frequencies));
    const selectedNodes = this.explorerManager.getSelectedNodes();
    const bucket = this.bucket;
    const frequencies = this.frequencies;
    // Explorer:
    const explorerIds = selectedNodes.filter((n) => allIds.has(n));
    // Bucket:
    const yes = filters.bucket.includes('yes');
    const no = filters.bucket.includes('no');
    const bucketIds = explorerIds.filter((id) => {
      if (!filters.bucket.length) return true;
      if (bucket[id] && yes) return true;
      if (!bucket[id] && no) return true;
      return false;
    });
    // Frequencies:
    const low = filters.frequencies.includes('low');
    const high = filters.frequencies.includes('high');
    const normal = filters.frequencies.includes('normal');
    const frequencyIds = bucketIds.filter((id) => {
      if (!filters.frequencies.length) return true;
      if (frequencies[id] === 'low' && low) return true;
      if (frequencies[id] === 'high' && high) return true;
      if (frequencies[id] === 'normal' && normal) return true;
      return false;
    });
    // Set filtered:
    this.filtered = frequencyIds;
  }

  public getFilters(): Filters {
    if (!this.filters) throw new Error('Filters not set!');
    return cloneDeep(this.filters.target);
  }

  public updateFilters(filters: Filters) {
    if (!this.filters) throw new Error('Filters not set!');
    Object.assign(this.filters.proxy, filters);
  }

  public recomputeQueues() {
    this.filter();
    this.flashcardsManager.recomputeQueues(this.filtered);
  }

  public async clearFilteredBucket() {
    this.guardDb(this.db);
    await this.db.run('BEGIN TRANSACTION');
    try {
      const stmt = await this.db.prepare('UPDATE meta SET bucket = FALSE WHERE noteId = ?');
      for (const id of this.filtered) {
        await stmt.run([id]);
        this.bucket[id] = false;
      }
      await stmt.finalize();
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      console.error('Failed clearing bucket:', err);
    }
  }

  public async clearFilteredFrequency(frequency: NoteFrequency) {
    this.guardDb(this.db);
    await this.db.run('BEGIN TRANSACTION');
    try {
      const stmt = await this.db.prepare(`
        UPDATE meta
        SET frequency = 'normal'
        WHERE noteId = ?
      `);
      for (const id of this.filtered) {
        if (this.frequencies[id] === frequency) {
          await stmt.run([id]);
          this.frequencies[id] = 'normal';
        }
      }
      await stmt.finalize();
      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      console.error('Failed clearing frequency:', err);
    }
  }

  public async clear() {
    this.flashcardsManager.clear();
    this.profileId = null;
    this.lastReviewedAt = {};
    this.frequencies = {};
    this.bucket = {};
    this.filters = null;
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
