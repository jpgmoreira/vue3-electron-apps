import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { TagsMap } from '@common/schemas/tags';

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
    clear() {
      this.tags = {};
    },
  },
});
