import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { TabGroup } from '@common/schemas/tabs';
import { InvokeChannels } from '@preload/channels/invoke';
import { cloneDeep, randomId } from '@interapp/utils/utils';
import { useNotesStore } from './notes';

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabGroups: [] as TabGroup[],
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.tabGroups) {
        this.tabGroups = data.tabGroups;
      }
    },
    updateTabGroups() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        window.api.invoke(InvokeChannels.updateTabs, cloneDeep(this.tabGroups));
      }, 500);
    },
    setActiveTab(group: TabGroup, tabId: string) {
      group.tabs.forEach((tab) => (tab.active = tab.id === tabId));
    },
    async explorerNoteClicked(noteId: string) {
      if (!this.tabGroups.length) {
        throw new Error('No tab groups!');
      }
      // 1. Make sure we have the note in the front:
      await useNotesStore().getNote(noteId);
      // 2. Verify if the note is already open in the current tab group:
      let activeGroup = this.tabGroups.find((g) => g.active);
      if (!activeGroup) {
        activeGroup = this.tabGroups[0];
        activeGroup.active = true;
      }
      const tab = activeGroup.tabs.find((tab) => tab.noteId === noteId);
      if (tab) {
        this.setActiveTab(activeGroup, tab.id);
        tab.preview = false;
        return;
      }
      // 3. Open it in a preview tab in the current tab group.
      let previewTab = activeGroup.tabs.find((tab) => tab.preview);
      if (!previewTab) {
        const tabId = randomId();
        previewTab = {
          id: tabId,
          noteId,
          preview: true,
          active: true,
        };
        activeGroup.tabs.push(previewTab);
      }
      previewTab.noteId = noteId;
      this.setActiveTab(activeGroup, previewTab.id);
    },
    async refetch() {
      const tabGroups = await window.api.invoke<TabGroup[]>(InvokeChannels.refetchTabs);
      this.tabGroups = tabGroups;
    },
    clear() {
      this.tabGroups = [];
    },
  },
});
