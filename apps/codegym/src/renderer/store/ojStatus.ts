import { InvokeChannels } from '@preload/channels/invoke';
import { defineStore } from 'pinia';
import { useToastStore } from '@interapp/store/toast';
import { useOjMetaStore } from './ojMeta';
import { Oj, OjList } from '@common/schemas/oj';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

export type OjStatusStoreState = {
  [k in Oj]: {
    isUpdatingCache: boolean;
    isRequestingProblem: boolean;
  };
};

export const useOjStatusStore = defineStore('ojStatus', {
  state: () => {
    const result = {} as OjStatusStoreState;
    for (const oj of OjList) {
      result[oj] = { isUpdatingCache: false, isRequestingProblem: false };
    }
    return result;
  },
  actions: {
    async updateOjCache(oj: Oj) {
      this[oj].isUpdatingCache = true;
      const toastStore = useToastStore();
      try {
        const result = await window.api.invoke<UpdateCacheResponseDTO<typeof oj>>(
          InvokeChannels.updateOjCache,
          oj
        );
        if (result.message) {
          toastStore.showToast(result.message, result.status);
        }
        useOjMetaStore().updateOjMeta(oj, result.meta);
      } catch (e: unknown) {
        toastStore.showToast('Unknown error happened while updating the cache.', 'error');
        throw e;
      } finally {
        this[oj].isUpdatingCache = false;
      }
    },
  },
});
