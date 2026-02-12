import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { TabGroup } from '@common/schemas/tabs';

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabGroup[],
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.tabs) {
        this.tabs = data.tabs;
      }
    },
    clear() {
      this.tabs = [];
    },
  },
});
