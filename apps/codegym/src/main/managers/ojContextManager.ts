import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { Oj } from '@common/schemas/oj';
import path from 'path';
import { OjContext, getEmptyOjContext } from '@common/schemas/ojContext';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { cloneDeep } from '@interapp/utils/utils';

export class OjContextManager {
  private _proxy: FileProxy<OjContext> | null = null;

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
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'ojContext.json');
    this._proxy = new FileProxy(fPath, getEmptyOjContext());
  }

  public getOjContext(): OjContext {
    if (!this.target) throw new Error('Oj context not initialized!');
    return cloneDeep(this.target);
  }

  public updateOjContext<T extends Oj>(oj: T, context: OjContext[T]) {
    if (!this.proxy) throw new Error('Oj context not initialized!');
    this.proxy[oj] = context;
  }

  public clear() {
    this._proxy = null;
  }
}
