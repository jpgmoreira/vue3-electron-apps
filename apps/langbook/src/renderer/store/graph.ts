import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { GraphRecord } from '@common/schemas/graph';

export const useGraphStore = defineStore('graph', {
  state: () => ({
    graph: [] as GraphRecord[],
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.graph) {
        this.graph = data.graph;
      }
    },
    clear() {
      this.graph = [];
    },
  },
});
