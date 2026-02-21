import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { cloneDeep } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { getEmptyNodeCounter, NodeCounter, NodeType } from '@common/schemas/nodeCounter';

export class NodeCounterManager {
  private _proxy: FileProxy<NodeCounter> | null = null;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
  }

  public loadProfile(profileId: string) {
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'counter.json');
    this._proxy = new FileProxy(fPath, getEmptyNodeCounter());
  }

  public getCounter() {
    if (!this.target) throw new Error('UI settings not initialized!');
    return cloneDeep(this.target);
  }

  public increment(type: NodeType) {
    if (!this.proxy) throw new Error('UI settings not initialized!');
    if (type === 'file') this.proxy.nextFile++;
    else this.proxy.nextDir++;
  }

  public clear() {
    this._proxy = null;
  }
}
