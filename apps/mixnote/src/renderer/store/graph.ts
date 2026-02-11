import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { GraphRecord } from '@common/schemas/graph';
import { InvokeChannels } from '@preload/channels/invoke';

export const useGraphStore = defineStore('graph', {
  state: () => ({
    graph: [] as GraphRecord[],
    timer: undefined as ReturnType<typeof setInterval> | undefined,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.graph) {
        this.graph = data.graph;
      }
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.incrementTodayRecord();
      }, 60_000);
    },
    async incrementTodayRecord() {
      const record = await window.api.invoke<GraphRecord>(InvokeChannels.incrementGraph);
      if (!this.graph.length) {
        this.graph.push(record);
        return;
      }
      const last = this.graph.at(-1)!;
      if (record.date !== last.date) {
        this.graph.push(record);
      } else {
        last.minutes = record.minutes;
      }
    },
    clear() {
      this.graph = [];
      clearInterval(this.timer);
    },
  },
});
