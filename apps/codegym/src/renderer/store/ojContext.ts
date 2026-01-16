import { defineStore } from 'pinia';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjContext } from '@common/schemas/ojContext';
import { Oj } from '@common/schemas/oj';

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
      // Should be used after you manually mutated the context somewhere else.
      const context = this.context[oj];
      window.api.invoke(InvokeChannels.updateOjContext, oj, toRawDeep(context));
    },
    clear() {
      this.context = getEmptyOjContext();
    },
  },
});
