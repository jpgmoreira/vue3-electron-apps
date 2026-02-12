import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import fs from 'fs';
import { getEmptyNote, Note } from '@common/schemas/notes';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { ProfileManager } from '../profileManager';
import { TabsManager } from '../tabsManager';

export class NotesManager {
  private profileId: string | null = null;
  private profileManager: ProfileManager;
  private tabsManager: TabsManager;

  constructor(emitter: EventEmitter, profileManager: ProfileManager, tabsManager: TabsManager) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.profileManager = profileManager;
    this.tabsManager = tabsManager;
  }

  private guard(noteId: string) {
    if (!this.profileId) throw new Error('Profile not initialized.');
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', noteId);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Note does not exist!: ${noteId}`);
    }
    return dirPath;
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
  }

  public createNote(name: string): Note {
    if (!this.profileId) throw new Error('Profile not initialized.');
    const now = Date.now();
    const note = getEmptyNote(name, now);
    const dirPath = path.join(DATA_DIR, 'profileData', this.profileId, 'notes', note.id);
    ensureDirExists(dirPath);
    const fPath = path.join(dirPath, `${note.id}.json`);
    new FileProxy(fPath, note);
    return note;
  }

  public deleteNote(noteId: string) {
    const dirPath = this.guard(noteId);
    fs.rmSync(dirPath, { recursive: true, force: true });
    this.profileManager.addNotes(-1);
    this.tabsManager.noteWasDeleted(noteId);
  }

  public getNote(noteId: string): Note {
    const dirPath = this.guard(noteId);
    const notePath = path.join(dirPath, `${noteId}.json`);
    return JSON.parse(fs.readFileSync(notePath, 'utf-8')) as Note;
  }

  public clear() {
    this.profileId = null;
  }
}
