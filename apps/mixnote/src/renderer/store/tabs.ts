import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { TabGroup } from '@common/schemas/tabs';
import { InvokeChannels } from '@preload/channels/invoke';

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
    async refetch() {
      const tabs = await window.api.invoke<TabGroup[]>(InvokeChannels.refetchTabs);
      this.tabs = tabs;
    },
    clear() {
      this.tabs = [];
    },
  },
});
