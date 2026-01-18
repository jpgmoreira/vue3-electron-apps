import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { getEmptyUISettings, UISettings } from '@common/schemas/ui';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { cloneDeep } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';

export class UIManager {
  private _proxy: FileProxy<UISettings> | null = null;

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
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'ui.json');
    this._proxy = new FileProxy(fPath, getEmptyUISettings());
  }

  public getUISettings() {
    if (!this.target) throw new Error('UI settings not initialized!');
    return cloneDeep(this.target);
  }

  public setUISettings(settings: Partial<UISettings>) {
    if (!this.proxy) throw new Error('UI settings not initialized!');
    Object.assign(this.proxy, settings);
  }

  public contestDeleted(contestId: string) {
    if (!this.proxy) throw new Error('UI settings not initialized!');
    if (this.proxy.currContestId === contestId) {
      this.proxy.currContestId = null;
    }
  }

  public clear() {
    this._proxy = null;
  }
}
