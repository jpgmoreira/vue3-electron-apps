import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { InvokeChannels } from '@preload/channels/invoke';
import { arrayRemove, cloneDeep } from '@interapp/utils/utils';
import { getEmptyFilters } from '@common/schemas/filters';
import { NoteFrequency } from '@common/schemas/notes';
import { YesOrNo } from '@interapp/types/yesOrNo';

export const useFiltersStore = defineStore('filters', {
  state: () => ({
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
    },
    async toggleFrequency(value: NoteFrequency) {
      this.toggle(this.filters.frequencies, value);
      await this.persistFilters();
    },
    async toggleBucket(value: YesOrNo) {
      this.toggle(this.filters.bucket, value);
      await this.persistFilters();
    },
    async persistFilters() {
      await window.api.invoke(InvokeChannels.updateFilters, cloneDeep(this.filters));
    },
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
