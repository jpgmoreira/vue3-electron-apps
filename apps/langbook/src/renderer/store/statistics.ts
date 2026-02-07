import { defineStore } from 'pinia';
import { InvokeChannels } from '@preload/channels/invoke';
import { getEmptyStatistics, Statistics } from '@common/schemas/statistics';

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    statistics: getEmptyStatistics(),
  }),
  actions: {
    async refetch() {
      const statistics = await window.api.invoke<Statistics>(InvokeChannels.getStatistics);
      this.statistics = statistics;
    },
    clear() {
      this.statistics = getEmptyStatistics();
    },
  },
});
