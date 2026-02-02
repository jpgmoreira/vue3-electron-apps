import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptySettings, Settings } from '@common/schemas/settings';
import { InvokeChannels } from '@preload/channels/invoke';
import { cloneDeep } from '@interapp/utils/utils';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: getEmptySettings(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.settings) {
        this.settings = data.settings;
      }
    },
    updateSettings(settings: Partial<Settings>) {
      Object.assign(this.settings, settings);
      window.api.invoke(InvokeChannels.updateSettings, cloneDeep(this.settings));
    },
    clear() {
      this.settings = getEmptySettings();
    },
  },
});
