import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, type Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { InvokeChannels } from '@preload/channels/invoke';
import { eventEmitter } from '@renderer/events/emitter';
import { CommonEvents } from '@interapp/events/commonEvents';

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
    async createProfile(name: string) {
      const result = await window.api.invoke<AuthResponseDTO>(InvokeChannels.createProfile, name);
      if (result.status === 'success') {
        eventEmitter.emit(CommonEvents.loadInitialData, result.data);
      }
      return result;
    },
  },
});
