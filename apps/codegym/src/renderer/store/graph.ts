import { getEmptyGraphRecord, GraphRecord } from '@common/schemas/graph';
import { StartupData } from '@common/schemas/startup';
import { OjWithContests } from '@common/schemas/oj';
import { getTodayDate } from '@interapp/utils/dateUtils';
import { defineStore } from 'pinia';

export const useGraphStore = defineStore('graph', {
  state: () => ({
    graphData: [] as GraphRecord[],
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.graphData = data.graphData;
    },
    clear() {
      this.graphData = [];
    },
    findGraphRecord(date: number): GraphRecord | null {
      let left = 0;
      let right = this.graphData.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midDate = this.graphData[mid].date;
        if (midDate === date) return this.graphData[mid];
        else if (midDate < date) left = mid + 1;
        else right = mid - 1;
      }
      return null;
    },
    updateGraph(source: OjWithContests, date: number, value: 1 | -1) {
      const today = getTodayDate();
      let record = this.findGraphRecord(date);
      if (!record) {
        if (date !== today) return;
        record = getEmptyGraphRecord(today);
        this.graphData.push(record);
      }
      record[source] += value;
      //TODO: SEND TO BACKEND
    },
  },
});
