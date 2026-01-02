import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjMeta, OjMeta } from '@common/schemas/ojMeta';
import { Oj } from '@common/types/oj';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@renderer/events/events';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
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
