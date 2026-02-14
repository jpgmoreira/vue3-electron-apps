import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import fs from 'fs';
import { getEmptyNote, Note } from '@common/schemas/notes';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { ProfileManager } from '../profileManager';
import { TabsManager } from '../tabsManager';
import { NotesMediaManager } from './media/notesMediaManager';
import { FlashcardsManager } from './flashcardsManager';
import { BooleanMap, FrequencyMap, TimestampMap } from '@common/schemas/maps';
import { FileProxy } from '@interapp/utils/fileProxy';
import { Statistics } from '@common/schemas/statistics';
import { ExplorerManager } from '@interapp/components/Explorer/main/explorerManager';

export class NotesManager {
  private profileId: string | null = null;
  private profileManager: ProfileManager;
  private tabsManager: TabsManager;
  private mediaManager: NotesMediaManager;
  private flashcardsManager: FlashcardsManager;
  private explorerManager: ExplorerManager;

  private lastReviewedAt: FileProxy<TimestampMap> | null = null;
  private frequencies: FileProxy<FrequencyMap> | null = null;
  private bucket: FileProxy<BooleanMap> | null = null;

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

  private guardMaps() {
    if (!this.lastReviewedAt) throw new Error('lastReviewedAt not set!');
    if (!this.frequencies) throw new Error('frequencies not set!');
    if (!this.bucket) throw new Error('bucket not set!');
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId);
    const lastReviewedPath = path.join(dirPath, 'lastReviewedAt.json');
    const frequenciesPath = path.join(dirPath, 'frequencies.json');
    const bucketPath = path.join(dirPath, 'bucket.json');
    this.lastReviewedAt = new FileProxy(lastReviewedPath, {});
    this.frequencies = new FileProxy(frequenciesPath, {});
    this.bucket = new FileProxy(bucketPath, {});
    this.flashcardsManager.setMaps(this.lastReviewedAt.target, this.frequencies.target);
  }

  public createNote(name: string): Note {
    if (!this.profileId) throw new Error('Profile not initialized.');
    this.guardMaps();
    const now = Date.now();
    const note = getEmptyNote(name, now);
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    fs.writeFileSync(fPath, JSON.stringify(note), 'utf-8');
    this.lastReviewedAt!.proxy[note.id] = now;
    this.frequencies!.proxy[note.id] = note.frequency;
    this.bucket!.proxy[note.id] = note.bucket;
    return note;
  }

  public deleteNote(noteId: string) {
    this.guardMaps();
    const dirPath = this.guard(noteId);
    fs.rmSync(dirPath, { recursive: true, force: true });
    this.profileManager.addNotes(-1);
    this.tabsManager.noteWasDeleted(noteId);
    delete this.lastReviewedAt!.proxy[noteId];
    delete this.frequencies!.proxy[noteId];
    delete this.bucket!.proxy[noteId];
  }

  public getNote(noteId: string): Note {
    const dirPath = this.guard(noteId);
    const notePath = path.join(dirPath, `${noteId}.json`);
    const note = JSON.parse(fs.readFileSync(notePath, 'utf-8')) as Note;
    this.mediaManager.preparePaths(note, dirPath);
    return note;
  }

  private atomicallyUpdateNote(note: Note) {
    const dirPath = this.guard(note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    const tmpPath = path.join(dirPath, `${note.id}.json.tmp`);
    fs.writeFileSync(tmpPath, JSON.stringify(note), 'utf-8');
    if (fs.existsSync(fPath)) fs.rmSync(fPath);
    fs.renameSync(tmpPath, fPath);
  }

  public async updateNote(note: Note) {
    if (!this.profileId) throw new Error('Profile not initialized.');
    this.guardMaps();
    await this.mediaManager.noteWasUpdated(note, this.profileId);
    this.atomicallyUpdateNote(note);
    const frequenciesProxy = this.frequencies!.proxy;
    const bucketProxy = this.bucket!.proxy;
    if (note.frequency !== frequenciesProxy[note.id]) {
      frequenciesProxy[note.id] = note.frequency;
    }
    const noteBucket = Boolean(note.bucket);
    if (noteBucket !== bucketProxy[note.id]) {
      bucketProxy[note.id] = noteBucket;
    }
  }

  public async getFlashcard(noteId: string | null): Promise<Note | null> {
    this.guardMaps();
    if (noteId) return this.getNote(noteId);
    const nextId = this.flashcardsManager.getNextFlashcard();
    if (!nextId) return null;
    this.lastReviewedAt!.proxy[nextId] = Date.now();
    return this.getNote(nextId);
  }

  public getStatistics(): Statistics {
    this.guardMaps();
    const frequencies = this.frequencies!.target;
    const bucket = this.bucket!.target;
    const allIds = new Set(Object.keys(frequencies));
    const selectedNodes = this.explorerManager.getSelectedNodes();
    const filteredIds = selectedNodes.filter((n) => allIds.has(n));
    const total = allIds.size;
    const totalBucket = Object.values(bucket).filter(Boolean).length;
    const totalLow = Object.values(frequencies).filter((v) => v === 'low').length;
    const totalHigh = Object.values(frequencies).filter((v) => v === 'high').length;
    const totalNormal = Object.values(frequencies).filter((v) => v === 'normal').length;
    const filtered = filteredIds.length;
    const filteredBucket = filteredIds.filter((v) => bucket[v]).length;
    const filteredLow = filteredIds.filter((v) => frequencies[v] === 'low').length;
    const filteredHigh = filteredIds.filter((v) => frequencies[v] === 'high').length;
    const filteredNormal = filteredIds.filter((v) => frequencies[v] === 'normal').length;
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

  public clear() {
    this.flashcardsManager.clear();
    this.profileId = null;
    this.lastReviewedAt = null;
    this.frequencies = null;
    this.bucket = null;
  }
}
