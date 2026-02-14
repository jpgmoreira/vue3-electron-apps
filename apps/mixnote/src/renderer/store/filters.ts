import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { InvokeChannels } from '@preload/channels/invoke';
import { cloneDeep } from '@interapp/utils/utils';
import { Filters, getEmptyFilters } from '@common/schemas/filters';

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
    updateFilters(filters: Partial<Filters>) {
      Object.assign(this.filters, filters);
      window.api.invoke(InvokeChannels.updateFilters, cloneDeep(this.filters));
    },
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
