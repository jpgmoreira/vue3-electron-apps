import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { getEmptyNote, Note } from '@common/schemas/notes';
import { ensureDirExists } from '@interapp/utils/fileUtils';

export class NotesManager {
  private profileId: string | null = null;

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
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

  public clear() {
    this.profileId = null;
  }
}
