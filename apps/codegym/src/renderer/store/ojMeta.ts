import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjMeta, OjMeta } from '@common/schemas/ojMeta';
import { Oj } from '@common/types/oj';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';

EventEmitter.instance.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useOjMetaStore().initFromStartupData(data);
});

export const useOjMetaStore = defineStore('ojMeta', {
  state: () => ({
    ojMeta: getEmptyOjMeta(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.ojMeta = data.ojMeta;
    },
    updateOjMeta<T extends Oj>(oj: T, data: OjMeta[T]) {
      this.ojMeta[oj] = data;
    },
  },
});
