import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { getEmptySession, SessionsMap, Session } from '@common/schemas/session';
import { buildId, cloneDeep } from '@interapp/utils/utils';
import path from 'path';
import { Card } from '@common/schemas/card';
import { ProfileManager } from './profileManager';
import { CardsManager } from './cards/cardsManager';

export class SessionsManager {
  private _proxy: FileProxy<SessionsMap> | null = null;
  private profileManager: ProfileManager;
  private cardsManager: CardsManager | null = null;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(profileManager: ProfileManager, emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
    this.profileManager = profileManager;
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'sessions.json');
    this._proxy = new FileProxy(filePath, {});
  }

  public getSessionsMap() {
    return cloneDeep(this.target || {});
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

  public cardWasCreated(card: Card) {
    if (!this.proxy) throw new Error('Sessions not initialized!');
    for (const session of card.sessions) {
      this.proxy[session].count++;
    }
  }

  public cardWasDeleted(card: Card) {
    if (!this.proxy) throw new Error('Sessions not initialized!');
    for (const session of card.sessions) {
      if (session in this.proxy) {
        this.proxy[session].count--;
      }
    }
  }

  public async deleteSession(sessionId: string) {
    if (!this.proxy) throw new Error('Sessions map not set!');
    if (!this.cardsManager) throw new Error('Cards manager not set!');
    this.profileManager.addSessions(-1);
    await this.cardsManager.sessionWasDeleted(sessionId);
    delete this.proxy[sessionId];
  }

  public setCardsManager(cardsManager: CardsManager) {
    this.cardsManager = cardsManager;
  }

  public clear() {
    this._proxy = null;
  }
}
