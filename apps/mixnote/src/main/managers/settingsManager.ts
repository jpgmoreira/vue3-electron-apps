import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { cloneDeep } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { Settings, getEmptySettings } from '@common/schemas/settings';

export class SettingsManager {
  private _proxy: FileProxy<Settings> | null = null;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
  }

  private guard<T extends Settings>(obj: T | null): asserts obj is T {
    if (!obj) throw new Error('Settings not initialized!');
  }

  public loadProfile(profileId: string) {
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'settings.json');
    this._proxy = new FileProxy(fPath, getEmptySettings());
  }

  public getSettings(): Settings {
    this.guard(this.target);
    return cloneDeep(this.target);
  }

  public update(settings: Settings) {
    this.guard(this.proxy);
    Object.assign(this.proxy, settings);
  }

  public clear() {
    this._proxy = null;
  }
}
