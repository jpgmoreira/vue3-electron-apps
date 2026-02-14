import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import fs from 'fs';
import { getEmptyNote, getEmptyPersistentNote, Note, PersistentNote } from '@common/schemas/notes';
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
    const filtersPath = path.join(dirPath, 'filters.json');
    this.lastReviewedAt = new FileProxy(lastReviewedPath, {});
    this.frequencies = new FileProxy(frequenciesPath, {});
    this.bucket = new FileProxy(bucketPath, {});
    this.filters = new FileProxy(filtersPath, getEmptyFilters());
    this.flashcardsManager.setMaps(this.lastReviewedAt.target, this.frequencies.target);
  }

  public createNote(name: string): Note {
    if (!this.profileId) throw new Error('Profile not initialized.');
    this.guardMaps();
    const now = Date.now();
    const note = getEmptyNote(name, now);
    const persistent = getEmptyPersistentNote(name, now);
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    fs.writeFileSync(fPath, JSON.stringify(persistent), 'utf-8');
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
    this.guardMaps();
    const dirPath = this.guard(noteId);
    const notePath = path.join(dirPath, `${noteId}.json`);
    const persistent = JSON.parse(fs.readFileSync(notePath, 'utf-8')) as PersistentNote;
    const note: Note = {
      ...persistent,
      bucket: this.bucket!.target[noteId],
      frequency: this.frequencies!.target[noteId],
    };
    this.mediaManager.preparePaths(note, dirPath);
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
    this.guardMaps();
    await this.mediaManager.noteWasUpdated(note, this.profileId);
    this.atomicallyUpdateNote(note);
    const frequenciesProxy = this.frequencies!.proxy;
    const bucketProxy = this.bucket!.proxy;
    if (note.frequency !== frequenciesProxy[note.id]) {
      frequenciesProxy[note.id] = note.frequency;
    }
    if (note.bucket !== bucketProxy[note.id]) {
      bucketProxy[note.id] = note.bucket;
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
    this.filter();
    const frequencies = this.frequencies!.target;
    const bucket = this.bucket!.target;
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
    this.guardMaps();
    if (!this.filters) throw new Error('Filters not set!');
    const filters = this.filters.target;
    const allIds = new Set(Object.keys(this.frequencies!.target));
    const selectedNodes = this.explorerManager.getSelectedNodes();
    const bucket = this.bucket!.target;
    const frequencies = this.frequencies!.target;
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

  public clearFilteredBucket() {
    this.guardMaps();
    for (const id of this.filtered) {
      this.bucket!.proxy[id] = false;
    }
  }

  public clearFilteredFrequency() {
    this.guardMaps();
    for (const id of this.filtered) {
      this.frequencies!.proxy[id] = 'normal';
    }
  }

  public clear() {
    this.flashcardsManager.clear();
    this.profileId = null;
    this.lastReviewedAt = null;
    this.frequencies = null;
    this.bucket = null;
    this.filters = null;
  }
}
