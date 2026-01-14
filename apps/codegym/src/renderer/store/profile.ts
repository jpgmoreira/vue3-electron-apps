import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, type Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    currProfile: null as Profile | null,
    registry: getEmptyProfileRegistry(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.currProfile = data.currProfile;
      this.registry = data.profileRegistry;
    },
  },
});
