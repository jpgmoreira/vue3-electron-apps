import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { SessionsMap } from '@common/schemas/session';
import { InvokeChannels } from '@preload/channels/invoke';

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
    async refetch() {
      const sessions = await window.api.invoke<SessionsMap>(InvokeChannels.refetchSessions);
      this.sessions = sessions;
    },
    getMostRecentSession() {
      const sessions = Object.values(this.sessions);
      if (!sessions.length) return null;
      let result = sessions[0];
      for (const session of sessions) {
        if (session.createdAt > result.createdAt) {
          result = session;
        }
      }
      return result;
    },
    clear() {
      this.sessions = {};
    },
  },
});
