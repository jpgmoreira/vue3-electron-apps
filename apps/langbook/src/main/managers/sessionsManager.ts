import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { getEmptySession, SessionsMap, Session } from '@common/schemas/session';
import { buildId, cloneDeep } from '@interapp/utils/utils';
import path from 'path';

export class SessionsManager {
  private _proxy: FileProxy<SessionsMap> | null = null;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'sessions.json');
    this._proxy = new FileProxy(filePath, {});
  }

  public getSessionsMap() {
    return cloneDeep(this.target);
  }

  public createSession(n: number): Session {
    if (!this.proxy) throw new Error('Sessions not initialized!');
    const now = Date.now();
    const name = `Session ${n}`;
    const id = buildId(name, now);
    const newSession = getEmptySession(id, name, now);
    this.proxy[id] = newSession;
    return newSession;
  }

  public clear() {
    this._proxy = null;
  }
}
