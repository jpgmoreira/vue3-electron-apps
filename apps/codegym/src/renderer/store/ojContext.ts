import { defineStore } from 'pinia';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjContext } from '@common/schemas/ojContext';
import { Oj } from '@common/schemas/oj';
import { useOjStatusStore } from './ojStatus';
import { useOjMetaStore } from './ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { useToastStore } from '@interapp/store/toast';
import { getTodayDate } from '@interapp/utils/dateUtils';
import { useGraphStore } from './graph';

export const useOjContextStore = defineStore('ojContext', {
  state: () => ({
    context: getEmptyOjContext(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.ojContext) {
        this.context = data.ojContext;
      }
    },
    flushOjContext(oj: Oj) {
      // Should be used after you mutated the context somewhere else.
      const context = this.context[oj];
      window.api.invoke(InvokeChannels.updateOjContext, oj, toRawDeep(context));
    },
    toggleSnapshotSolved(oj: Oj) {
      const graphStore = useGraphStore();
      const snapshot = this.context[oj].snapshot;
      if (!snapshot) throw new Error('Invalid snapshot!');
      const prev = snapshot.solvedDate;
      const today = getTodayDate();
      snapshot.solvedDate = prev ? null : today;
      if (prev) graphStore.updateGraph(oj, prev, -1);
      else graphStore.updateGraph(oj, today, 1);
      window.api.invoke(InvokeChannels.updateSnapshot, toRawDeep(snapshot));
    },
    async requestNewProblem(oj: Oj) {
      const ojStatusStore = useOjStatusStore();
      const ojMetaStore = useOjMetaStore();
      const toastStore = useToastStore();
      let result: GetOjProblemResponseDTO<typeof oj>;
      if (!ojMetaStore.ojMeta[oj].lastCacheUpdate) {
        try {
          await ojStatusStore.updateOjCache(oj);
        } catch {
          return;
        }
      }
      ojStatusStore[oj].isRequestingProblem = true;
      try {
        result = await window.api.invoke<GetOjProblemResponseDTO<typeof oj>>(
          InvokeChannels.getOjProblem,
          oj
        );
        this.context[oj].hasEverFiltered = true;
      } catch {
        toastStore.showToast('Error while requesting a new problem.', 'error');
        return;
      } finally {
        ojStatusStore[oj].isRequestingProblem = false;
      }
      const { snapshot, matched } = result;
      this.context[oj].matched = matched;
      this.context[oj].snapshot = snapshot;
    },
    clear() {
      this.context = getEmptyOjContext();
    },
  },
});
