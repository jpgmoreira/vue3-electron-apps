import { FileProxy } from '@interapp/utils/fileProxy';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { getEmptyTabGroup, TabGroup } from '@common/schemas/tabs';
import { cloneDeep, randomId } from '@interapp/utils/utils';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';

type TabsManagerProxy = {
  groups: TabGroup[];
};

export class TabsManager {
  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
  }

  private _proxy: FileProxy<TabsManagerProxy> | null = null;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  public loadProfile(profileId: string) {
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'tabs.json');
    const id = randomId();
    const group = getEmptyTabGroup(id);
    this._proxy = new FileProxy(fPath, { groups: [group] });
  }

  public getGroups(): TabGroup[] {
    if (!this.target) throw new Error('Cannot get tab groups before initialization!');
    return cloneDeep(this.target.groups);
  }

  public updateGroups(groups: TabGroup[]) {
    if (!this.proxy) throw new Error('Proxy not initialized');
    this.proxy.groups = groups;
  }

  public noteWasDeleted(noteId: string) {
    if (!this.proxy) throw new Error('Proxy not initialized');
    for (const group of this.proxy.groups) {
      group.tabs = group.tabs.filter((t) => t.noteId !== noteId);
    }
  }

  public clear() {
    this._proxy = null;
  }
}
