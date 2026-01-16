import { defineStore } from 'pinia';
import { getEmptyUISettings, UISettings } from '@common/schemas/ui';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';

export const useUIStore = defineStore('ui', {
  state: () => ({
    settings: getEmptyUISettings(),
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.ui) {
        this.settings = data.ui;
      }
    },
    updateSettings(settings: Partial<UISettings>) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        Object.assign(this.settings, settings);
        window.api.invoke(InvokeChannels.updateUISettings, toRawDeep(this.settings));
      }, 500);
    },
    clear() {
      this.settings = getEmptyUISettings();
    },
  },
});
