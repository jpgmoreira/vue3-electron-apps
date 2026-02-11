import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, ProfileRegistry, type Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { InvokeChannels } from '@preload/channels/invoke';
import { eventEmitter } from '@renderer/events/emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';

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
    async renameProfile(profileId: string, newName: string) {
      const result = await window.api.invoke<GenericResponseDTO>(
        InvokeChannels.renameProfile,
        profileId,
        newName
      );
      if (result.status === 'success') {
        const record = this.registry.profileRecords.find((p) => p.id === profileId);
        record!.name = newName;
      }
      return result;
    },
    async deleteProfile(profileId: string) {
      const { profileRecords } = this.registry;
      for (let i = 0; i < profileRecords.length; i++) {
        if (profileRecords[i].id === profileId) {
          profileRecords.splice(i, 1);
          break;
        }
      }
      return window.api.invoke<GenericResponseDTO>(InvokeChannels.deleteProfile, profileId);
    },
    async login(profileId: string) {
      const result = await window.api.invoke<AuthResponseDTO>(InvokeChannels.login, profileId);
      if (result.status === 'success') {
        eventEmitter.emit(CommonEvents.loadInitialData, result.data);
      }
      return result;
    },
    async logout() {
      eventEmitter.emit(CommonEvents.clearProfileData);
      this.currProfile = null;
      await window.api.invoke(InvokeChannels.logout);
    },
    async refetch() {
      const registry = await window.api.invoke<ProfileRegistry>(InvokeChannels.refetchProfile);
      this.registry = registry;
    },
  },
});
