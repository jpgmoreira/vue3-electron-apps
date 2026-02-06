import { defineStore } from 'pinia';
import { getEmptyUISettings, UISettings } from '@common/schemas/ui';
import { InvokeChannels } from '@preload/channels/invoke';
import { toRawDeep } from '@interapp/utils/utils';
import { StartupData } from '@common/schemas/startup';
import { MediaFile } from '@interapp/types/mediaFile';

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Persisted settings:
    settings: getEmptyUISettings(),
    // Not persisted:
    showFilters: true,
    cardsScrollTop: 0,
    mediaModal: {
      visible: false,
      media: null as MediaFile | null,
    },
    // Internal:
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.ui) {
        this.settings = data.ui;
      }
    },
    updateSettings(settings: Partial<UISettings>) {
      Object.assign(this.settings, settings);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        window.api.invoke(InvokeChannels.updateUISettings, toRawDeep(this.settings));
      }, 500);
    },
    toggleShowFilters() {
      this.showFilters = !this.showFilters;
    },
    showMediaModal(media: MediaFile) {
      this.mediaModal.visible = true;
      this.mediaModal.media = media;
    },
    setCardsScrollTop(value: number) {
      this.cardsScrollTop = value;
    },
    hideMediaModal() {
      this.mediaModal.visible = false;
      this.mediaModal.media = null;
    },
    clear() {
      this.settings = getEmptyUISettings();
      this.showFilters = true;
      this.hideMediaModal();
    },
  },
});
