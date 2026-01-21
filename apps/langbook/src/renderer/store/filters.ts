import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptyFilters } from '@common/schemas/filters';
import { CardFrequency } from '@common/schemas/card';
import { arrayRemove, toRawDeep } from '@interapp/utils/utils';
import { YesOrNo } from '@interapp/types/yesOrNo';
import { InvokeChannels } from '@preload/channels/invoke';

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    dirty: false,
    filters: getEmptyFilters(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.filters) {
        this.filters = data.filters;
      }
    },
    toggle<T>(arr: T[], value: T) {
      if (arr.includes(value)) arrayRemove(arr, value);
      else arr.push(value);
      this.dirty = true;
    },
    toggleFrequency(value: CardFrequency) {
      this.toggle(this.filters.frequencies, value);
    },
    toggleBucket(value: YesOrNo) {
      this.toggle(this.filters.bucket, value);
    },
    setDirty(value: boolean) {
      this.dirty = value;
    },
    toggleTagMode() {
      if (this.filters.tagMode === 'all') {
        this.filters.tagMode = 'any';
      } else {
        this.filters.tagMode = 'all';
      }
      this.dirty = true;
    },
    selectTag(tag: string) {
      const tags = this.filters.tags;
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
      this.dirty = true;
    },
    deselectTag(tag: string) {
      arrayRemove(this.filters.tags, tag);
      this.dirty = true;
    },
    async updateFilters() {
      await window.api.invoke(InvokeChannels.updateFilters, toRawDeep(this.filters));
      this.dirty = false;
    },
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
