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

export class NotesManager {
  private profileId: string | null = null;
  private profileManager: ProfileManager;
  private tabsManager: TabsManager;
  private mediaManager: NotesMediaManager;
  private flashcardsManager: FlashcardsManager;

  private lastReviewed: FileProxy<TimestampMap> | null = null;
  private frequencies: FileProxy<FrequencyMap> | null = null;
  private bucket: FileProxy<BooleanMap> | null = null;

  constructor(
    emitter: EventEmitter,
    profileManager: ProfileManager,
    tabsManager: TabsManager,
    mediaManager: NotesMediaManager,
    flashcardsManager: FlashcardsManager
  ) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.profileManager = profileManager;
    this.tabsManager = tabsManager;
    this.mediaManager = mediaManager;
    this.flashcardsManager = flashcardsManager;
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
    if (!this.lastReviewed) throw new Error('lastReviewed not set!');
    if (!this.frequencies) throw new Error('frequencies not set!');
    if (!this.bucket) throw new Error('bucket not set!');
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId);
    const lastReviewedPath = path.join(dirPath, 'lastReviewed.json');
    const frequenciesPath = path.join(dirPath, 'frequencies.json');
    const bucketPath = path.join(dirPath, 'bucket.json');
    this.lastReviewed = new FileProxy(lastReviewedPath, {});
    this.frequencies = new FileProxy(frequenciesPath, {});
    this.bucket = new FileProxy(bucketPath, {});
    this.flashcardsManager.setMaps(this.lastReviewed.target, this.frequencies.target);
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
    this.lastReviewed!.proxy[note.id] = now;
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
    delete this.lastReviewed!.proxy[noteId];
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
    this.lastReviewed!.proxy[nextId] = Date.now();
    return this.getNote(nextId);
  }

  public clear() {
    this.flashcardsManager.clear();
    this.profileId = null;
    this.lastReviewed = null;
    this.frequencies = null;
    this.bucket = null;
  }
}
