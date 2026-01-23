import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { SessionsMap } from '@common/schemas/session';

export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    sessions: {} as SessionsMap,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.sessions) {
        this.sessions = data.sessions;
      }
    },
    clear() {
      this.sessions = {};
    },
  },
});
