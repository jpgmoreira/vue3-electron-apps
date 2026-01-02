import { Channels } from '@common/types/channels';
import { defineStore } from 'pinia';
import { useUIStore } from './ui';
import { useOjMetaStore } from './ojMeta';
import { useProfileStore } from './profile';
import { Oj, OjList } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';

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
      try {
        const meta: OjMeta[typeof oj] = await window.api.invoke(Channels.updateOjCache, oj);
        useOjMetaStore().updateOjMeta(oj, meta);
      } catch (e) {
        const uiStore = useUIStore();
        uiStore.showToast('Error while updating the cache.', 'error');
        throw e;
      } finally {
        this[oj].isUpdatingCache = false;
      }
    },
    async requestNewProblem(oj: Oj) {
      this[oj].isRequestingProblem = true;
      try {
        const result = await window.api.invoke<GetOjProblemResponseDTO<typeof oj>>(
          Channels.getOjProblem,
          oj
        );
        const profileStore = useProfileStore();
        profileStore.currProfile!.ojContext[oj].hasEverFiltered = true;
        return result;
      } catch (e) {
        const uiStore = useUIStore();
        uiStore.showToast('Error while requesting a new problem.', 'error');
        throw e;
      } finally {
        this[oj].isRequestingProblem = false;
      }
    },
  },
});
