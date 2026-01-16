import { defineStore } from 'pinia';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjContext, OjContext } from '@common/schemas/ojContext';
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
    updateOjContext<T extends Oj>(oj: T, context: OjContext[T]) {
      Object.assign(this.context[oj], context);
      window.api.invoke(InvokeChannels.updateOjContext, oj, toRawDeep(context));
    },
    clear() {
      this.context = getEmptyOjContext();
    },
  },
});
