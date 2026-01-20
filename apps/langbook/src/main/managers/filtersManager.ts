import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { arrayContainsAll, arrayContainsAny, cloneDeep, isSubstring } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { Filters, getEmptyFilters } from '@common/schemas/filters';
import { Card } from '@common/schemas/card';
import { ExplorerManager } from '@interapp/components/Explorer/main/explorerManager';

export class FiltersManager {
  private _proxy: FileProxy<Filters> | null = null;
  private explorerManager: ExplorerManager;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(emitter: EventEmitter, explorerManager: ExplorerManager) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
    this.explorerManager = explorerManager;
  }

  public loadProfile(profileId: string) {
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'filters.json');
    this._proxy = new FileProxy(fPath, getEmptyFilters());
  }

  public getFilters() {
    if (!this.target) throw new Error('Filters not initialized!');
    return cloneDeep(this.target);
  }

  public setFilters(filters: Partial<Filters>) {
    if (!this.proxy) throw new Error('Filters not initialized!');
    Object.assign(this.proxy, filters);
  }

  public tagDeleted(tag: string) {
    if (!this.proxy) throw new Error('Filters not initialized!');
    if (this.proxy.tags.includes(tag)) {
      this.proxy.tags = this.proxy.tags.filter((t) => t !== tag);
    }
  }

  public satisfyCurrentFilters(card: Card): boolean {
    // - Frequency matching:
    if (!this.target) throw new Error('Filters not initialized!');
    if (this.target.frequencies.length && !this.target.frequencies.includes(card.frequency)) {
      return false;
    }
    // - Bucket matching:
    if (this.target.bucket.length) {
      const value = card.bucket ? 'yes' : 'no';
      if (!this.target.bucket.includes(value)) {
        return false;
      }
    }
    // - Text matching:
    if (
      this.target.text.trim() &&
      !(
        isSubstring(card.front, this.target.text) ||
        isSubstring(card.back, this.target.text) ||
        isSubstring(card.extra, this.target.text)
      )
    ) {
      return false;
    }
    // - Tags matching:
    if (this.target.tags.length) {
      if (this.target.tagMode === 'all') {
        if (!arrayContainsAll(card.tags, this.target.tags)) {
          return false;
        }
      } else if (this.target.tagMode === 'any') {
        if (!arrayContainsAny(card.tags, this.target.tags)) {
          return false;
        }
      }
    }
    // - Sessions matching:
    const selected = this.explorerManager.getSelectedNodes();
    if (!arrayContainsAny(selected, card.sessions)) {
      return false;
    }
    return true;
  }

  public clear() {
    this._proxy = null;
  }
}
