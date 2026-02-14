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
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
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
    toggleFrequency(value: NoteFrequency) {
      this.toggle(this.filters.frequencies, value);
      this.persistFilters();
    },
    toggleBucket(value: YesOrNo) {
      this.toggle(this.filters.bucket, value);
      this.persistFilters();
    },
    persistFilters() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        window.api.invoke(InvokeChannels.updateFilters, cloneDeep(this.filters));
      }, 500);
    },
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
