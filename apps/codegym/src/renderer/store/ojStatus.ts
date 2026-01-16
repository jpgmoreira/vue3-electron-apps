import { InvokeChannels } from '@preload/channels/invoke';
import { defineStore } from 'pinia';
import { useToastStore } from '@interapp/store/toast';
import { useOjMetaStore } from './ojMeta';
import { useProfileStore } from './profile';
import { Oj, OjList } from '@common/schemas/oj';
import { OjMeta } from '@common/schemas/ojMeta';
// TODO:
// import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';

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
      // TODO:
      // this[oj].isUpdatingCache = true;
      // try {
      //   const meta: OjMeta[typeof oj] = await window.api.invoke(InvokeChannels.updateOjCache, oj);
      //   useOjMetaStore().updateOjMeta(oj, meta);
      // } catch (e) {
      //   const toastStore = useToastStore();
      //   toastStore.showToast('Error while updating the cache.', 'error');
      //   throw e;
      // } finally {
      //   this[oj].isUpdatingCache = false;
      // }
    },
    async requestNewProblem(oj: Oj) {
      // TODO:
      // this[oj].isRequestingProblem = true;
      // try {
      //   const result = await window.api.invoke<GetOjProblemResponseDTO<typeof oj>>(
      //     InvokeChannels.getOjProblem,
      //     oj
      //   );
      //   const profileStore = useProfileStore();
      //   profileStore.currProfile!.ojContext[oj].hasEverFiltered = true;
      //   return result;
      // } catch (e) {
      //   const toastStore = useToastStore();
      //   toastStore.showToast('Error while requesting a new problem.', 'error');
      //   throw e;
      // } finally {
      //   this[oj].isRequestingProblem = false;
      // }
    },
  },
});
