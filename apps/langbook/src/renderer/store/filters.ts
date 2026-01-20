import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptyFilters } from '@common/schemas/filters';

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
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
