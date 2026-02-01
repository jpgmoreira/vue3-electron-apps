import { FileProxy } from '@interapp/utils/fileProxy';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { TagsMap } from '@common/schemas/tags';
import { Card } from '@common/schemas/card';
import { FiltersManager } from './filtersManager';
import { cloneDeep } from '@interapp/utils/utils';
import { CommonEvents } from '@interapp/events/commonEvents';

export class TagsManager {
  private _proxy: FileProxy<TagsMap> | null = null;
  private filtersManager: FiltersManager;

  private get proxy() {
    return this._proxy?.proxy || null;
  }

  private get target() {
    return this._proxy?.target || null;
  }

  constructor(emitter: EventEmitter, filtersManager: FiltersManager) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.filtersManager = filtersManager;
  }

  private guard<T extends TagsMap>(obj: T | null): asserts obj is T {
    if (!obj) throw new Error('Tags not initialized!');
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'tags.json');
    this._proxy = new FileProxy(filePath, {});
  }

  public getTags() {
    return cloneDeep(this.target || {});
  }

  private tagRemoveHelper(tag: string) {
    this.guard(this.proxy);
    if (tag in this.proxy) {
      this.proxy[tag]--;
      if (this.proxy[tag] === 0) {
        delete this.proxy[tag];
        this.filtersManager.tagWasDeleted(tag);
      }
    }
  }

  private tagAddHelper(tag: string) {
    this.guard(this.proxy);
    if (!(tag in this.proxy)) {
      this.proxy[tag] = 0;
    }
    this.proxy[tag]++;
  }

  public cardWasDeleted(card: Card) {
    this.guard(this.proxy);
    for (const tag of card.tags) {
      this.tagRemoveHelper(tag);
    }
  }

  public cardWasCreated(card: Card) {
    this.guard(this.proxy);
    for (const tag of card.tags) {
      this.tagAddHelper(tag);
    }
  }

  public cardWasUpdated(oldCard: Card, newCard: Card) {
    this.guard(this.proxy);
    const tagsRemoved = oldCard.tags.filter((t) => !newCard.tags.includes(t));
    const tagsAdded = newCard.tags.filter((t) => !oldCard.tags.includes(t));
    for (const tag of tagsRemoved) {
      this.tagRemoveHelper(tag);
    }
    for (const tag of tagsAdded) {
      this.tagAddHelper(tag);
    }
  }

  public clear() {
    this._proxy = null;
  }
}
