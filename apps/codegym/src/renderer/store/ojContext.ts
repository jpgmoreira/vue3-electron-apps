import { defineStore } from 'pinia';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjContext } from '@common/schemas/ojContext';
import { Oj } from '@common/schemas/oj';
import { useOjStatusStore } from './ojStatus';
import { useOjMetaStore } from './ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';

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
    async requestNewProblem(oj: Oj) {
      const ojStatusStore = useOjStatusStore();
      const ojMetaStore = useOjMetaStore();
      let result: GetOjProblemResponseDTO<typeof oj>;
      if (!ojMetaStore.ojMeta[oj].lastCacheUpdate) {
        try {
          await ojStatusStore.updateOjCache(oj);
        } catch {
          return;
        }
      }
    },
    clear() {
      this.context = getEmptyOjContext();
    },
  },
});
