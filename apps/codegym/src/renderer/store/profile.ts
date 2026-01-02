import { defineStore } from 'pinia';
import { AuthPage } from '@common/types/authPage';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { Oj } from '@common/types/oj';
import { Channels } from '@common/types/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { useOjStatusStore } from './ojStatus';
import { useOjMetaStore } from './ojMeta';
import { useGraphStore } from './graph';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { getTodayDate } from '@common/utils/dateUtils';
import { toRaw } from 'vue';
import { OjProblem } from '@common/schemas/problems';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@renderer/events/events';
import { Contest } from '@common/schemas/contests';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useProfileStore().clear();
});

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
    updateCurrPage(newPage: AuthPage) {
      this.currProfile!.page = newPage;
      window.api.send(Channels.updateCurrPage, newPage);
    },
    updateCurrOj(oj: Oj) {
      this.currProfile!.currOj = oj;
      window.api.send(Channels.updateCurrOj, oj);
    },
    async createProfile(name: string) {
      const result = await window.api.invoke<CreateProfileResponseDTO>(
        Channels.createProfile,
        name
      );
      if (result.status === 'success') {
        EventEmitter.instance.emit(Events.loadInitialData, result.data);
      }
      return result;
    },
    async login(profileId: string) {
      const result = await window.api.invoke<StartupData>(Channels.login, profileId);
      EventEmitter.instance.emit(Events.loadInitialData, result);
      return result;
    },
    logout() {
      EventEmitter.instance.emit(Events.clearProfileData);
      window.api.send(Channels.logout);
    },
    clear() {
      this.currProfile = null;
      this.registry.currProfileId = null;
    },
    deleteProfile() {
      const currProfileId = this.currProfile!.id;
      EventEmitter.instance.emit(Events.clearProfileData);
      const { profileRecords } = this.registry;
      for (let i = 0; i < profileRecords.length; i++) {
        if (profileRecords[i].id === currProfileId) {
          profileRecords.splice(i, 1);
          break;
        }
      }
      window.api.send(Channels.deleteCurrProfile);
    },
    async requestNewProblem() {
      const oj = this.currProfile!.currOj;
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
      try {
        result = await ojStatusStore.requestNewProblem(oj);
      } catch {
        return;
      }
      const { snapshot, matched } = result;
      const { ojContext } = this.currProfile!;
      ojContext[oj].matched = matched;
      ojContext[oj].snapshot = snapshot;
    },
    setCurrSnapshotSolved(value: boolean) {
      const graphStore = useGraphStore();
      const currOj = this.currProfile!.currOj;
      const ojContext = this.currProfile!.ojContext[currOj];
      const snapshot = ojContext.snapshot;
      if (!snapshot) return;
      const prevSolvedDate = snapshot.solvedDate;
      if (prevSolvedDate != null) {
        graphStore.updateGraphData(currOj, prevSolvedDate, -1);
      }
      const today = getTodayDate();
      if (value) {
        graphStore.updateGraphData(currOj, today, 1);
      }
      snapshot.solvedDate = value ? today : null;
      window.api.send(Channels.setCurrSnapshotSolvedDate, snapshot.solvedDate);
    },
    updateOjFilters() {
      const oj = this.currProfile!.currOj;
      window.api.send(Channels.updateOjFilters, oj, toRaw(this.currProfile!.ojContext[oj].filters));
    },
    setCurrOjSnapshot(snapshot: OjProblem[Oj]) {
      const currOj = this.currProfile!.currOj;
      const ojContext = this.currProfile!.ojContext[currOj];
      ojContext.snapshot = snapshot;
      window.api.send(Channels.setCurrOjSnapshot, toRaw(snapshot));
    },
    async renameCurrProfile(newName: string) {
      const result = await window.api.invoke<GenericResponseDTO>(
        Channels.renameCurrProfile,
        newName
      );
      if (result.status === 'success') {
        this.currProfile!.name = newName;
        const record = this.registry.profileRecords.find((p) => p.id === this.currProfile!.id);
        record!.name = newName;
      }
      return result;
    },
    async getCurrContest() {
      const currContestId = this.currProfile?.currContestId;
      if (!currContestId) return null;
      const result = window.api.invoke<Contest | null>(Channels.getContest, currContestId);
      if (currContestId && !result) {
        // Contest was deleted.
        this.currProfile!.currContestId = null;
      }
      return result;
    },
    setCurrContest(contestId: string | null) {
      if (!this.currProfile) return;
      this.currProfile.currContestId = contestId;
    },
  },
});
