import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { TagsMap } from '@common/schemas/tags';
import { InvokeChannels } from '@preload/channels/invoke';

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: {} as TagsMap,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.tags) {
        this.tags = data.tags;
      }
    },
    async refetch() {
      const tags = await window.api.invoke<TagsMap>(InvokeChannels.refetchTags);
      this.tags = tags;
    },
    clear() {
      this.tags = {};
    },
  },
});
