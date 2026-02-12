import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { cloneDeep } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { getEmptyNodeCounter, NodeCounter, NodeType } from '@common/schemas/counter';

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

  private guard<T extends NodeCounter>(obj: T | null): asserts obj is T {
    if (!obj) throw new Error('Node counter not initialized!');
  }

  public loadProfile(profileId: string) {
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'counter.json');
    this._proxy = new FileProxy(fPath, getEmptyNodeCounter());
  }

  public getCounter(): NodeCounter {
    this.guard(this.target);
    return cloneDeep(this.target);
  }

  public increment(type: NodeType) {
    this.guard(this.proxy);
    if (type === 'file') this.proxy.nextFile++;
    else this.proxy.nextDir++;
  }

  public clear() {
    this._proxy = null;
  }
}
