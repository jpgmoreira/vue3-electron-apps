<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue';
  import { useTabsStore } from '@renderer/store/tabs';
  import { storeToRefs } from 'pinia';
  import { TabGroup } from '@common/schemas/tabs';
  import { randomId, throttle } from '@interapp/utils/utils';
  import { Columns2Icon, AlignHorizontalDistributeCenterIcon, XIcon } from 'lucide-vue-next';
  import { useNotesStore } from '@renderer/store/notes';
  import EditorContainer from './EditorContainer.vue';
  import { Note } from '@common/schemas/notes';

  const MIN_GROUP_WIDTH = 30; // px.

  const tabsStore = useTabsStore();
  const notesStore = useNotesStore();

  const { tabGroups } = storeToRefs(tabsStore);

  const groupsContainer = useTemplateRef('groups-container');

  const resize = reactive({
    isResizing: false,
    index: 0,
    left: 0,
  });

  function computeTabGroupStyle(group: TabGroup) {
    return {
      width: `${group.width * 100}%`,
    };
  }

  function resetGroupWidths() {
    if (!tabGroups.value.length) {
      throw new Error('Cannot normalize empty tab groups!');
    }
    const width = 1 / tabGroups.value.length;
    for (const group of tabGroups.value) {
      group.width = width;
    }
  }

  /**
   * Add a new tab group: width will be equally distributed on new configuration.
   */
  function addTabGroup() {
    const newTabGroup: TabGroup = {
      id: randomId(),
      width: 0,
      active: false,
      tabs: [],
    };
    tabGroups.value.push(newTabGroup);
    resetGroupWidths();
  }

  /**
   * Close a tab group:
   *   - Closing the first tab group:
   *       The second tab group will consume its width.
   *   - Closing any other tab group:
   *       The tab group immediatelly to the left will
   *       consume its width.
   */
  function closeTabGroup(groupId: string) {
    if (tabGroups.value.length < 2) {
      throw new Error('Cannot close a tab group having less than 2 groups!');
    }
    const index = tabGroups.value.findIndex((g) => g.id === groupId);
    if (index === 0) {
      tabGroups.value[1].width += tabGroups.value[0].width;
    } else {
      tabGroups.value[index - 1].width += tabGroups.value[index].width;
    }
    tabGroups.value.splice(index, 1);
  }

  function setActiveGroup(index: number) {
    const groups = tabGroups.value;
    if (!groups.length) throw new Error('Empty tab groups.');
    if (groups.findIndex((g) => g.active) === index) return;
    groups.forEach((group) => (group.active = false));
    groups[index].active = true;
  }

  function hasActiveNote(group: TabGroup): Boolean {
    return group.tabs.some((tab) => tab.active);
  }

  function getActiveNote(group: TabGroup): Note | null {
    const activeTab = group.tabs.find((tab) => tab.active);
    if (!activeTab) return null;
    return notesStore.getNoteFromCache(activeTab.noteId);
  }

  function closeTab(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((t) => t.id === tabId);
    if (!tab) throw new Error('Close tab: tab not found!');
    group.tabs = group.tabs.filter((t) => t.id !== tabId);
  }

  function tabHeaderClick(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((tab) => tab.id === tabId);
    if (!tab) throw new Error('Tab header click: tab not found!');
    group.tabs.forEach((tab) => (tab.active = tab.id === tabId));
    tab.preview = false;
  }

  function resizerMouseDown(e: MouseEvent, index: number) {
    resize.isResizing = true;
    resize.index = index;
    resize.left = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  //  --- Watches: ---

  watch(tabGroups, tabsStore.updateTabGroups, { deep: true });

  //  --- Hooks: ---

  function windowMouseMove(e: MouseEvent) {
    if (!resize.isResizing) return;
    if (!groupsContainer.value) throw new Error('Invalid groups container!');
    if (tabGroups.value.length < 2) {
      throw new Error('Cannot resize having less than 2 groups!');
    }
    const container = groupsContainer.value;
    const containerRect = container.getBoundingClientRect();
    if (e.clientX < containerRect.left || e.clientX > containerRect.right) {
      return;
    }
    const containerWidth = containerRect.width || 1;
    const delta = e.clientX - resize.left;
    let totalRatio = Math.abs(delta / containerWidth);
    const index = resize.index;
    // Stacking effect:
    if (delta < 0) {
      // to left.
      const prevWidth = tabGroups.value[index].width;
      for (let i = index - 1; i >= 0; i--) {
        const group = tabGroups.value[i];
        const maxCanReduce = group.width - MIN_GROUP_WIDTH / containerWidth;
        if (maxCanReduce <= 0) continue;
        const toReduce = Math.min(maxCanReduce, totalRatio);
        totalRatio -= toReduce;
        group.width -= toReduce;
        tabGroups.value[index].width += toReduce;
        if (totalRatio <= 0) break;
      }
      const currWidth = tabGroups.value[index].width;
      if (prevWidth !== currWidth) {
        resize.left = e.clientX;
      }
    } else {
      // to right.
      const prevWidth = tabGroups.value[index - 1].width;
      for (let i = index; i < tabGroups.value.length; i++) {
        const group = tabGroups.value[i];
        const maxCanReduce = group.width - MIN_GROUP_WIDTH / containerWidth;
        if (maxCanReduce <= 0) continue;
        const toReduce = Math.min(maxCanReduce, totalRatio);
        totalRatio -= toReduce;
        group.width -= toReduce;
        tabGroups.value[index - 1].width += toReduce;
        if (totalRatio <= 0) break;
      }
      const currWidth = tabGroups.value[index - 1].width;
      if (prevWidth !== currWidth) {
        resize.left = e.clientX;
      }
    }
  }
  const windownMouseMoveThrottled = throttle(windowMouseMove, 100);
  function windowMouseUp() {
    resize.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windownMouseMoveThrottled);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windownMouseMoveThrottled);
  });
</script>

<template>
  <div class="notes-view flex absolute inset-0 overflow-hidden" ref="groups-container">
    <!-- Tab groups -->
    <div
      v-for="(group, index) in tabGroups"
      class="tab-group flex overflow-hidden"
      :key="group.id"
      :style="computeTabGroupStyle(group)"
      @click="setActiveGroup(index)"
      :class="{ active: group.active }"
    >
      <!-- Resizer -->
      <div
        v-if="index > 0"
        class="custom-resizer"
        @mousedown="resizerMouseDown($event, index)"
        @click.stop
      ></div>
      <!-- Tab area: -->
      <div class="flex grow flex-col max-w-full relative">
        <!-- Tab headers: -->
        <div class="flex flex-wrap">
          <div
            v-for="tab in group.tabs"
            class="tab-header flex justify-between whitespace-nowrap"
            :class="{ preview: tab.preview, active: tab.active }"
            :key="tab.id"
            @mousedown.middle.stop="closeTab(group, tab.id)"
            @click="tabHeaderClick(group, tab.id)"
          >
            <span class="tab-title">{{ notesStore.getNoteFromCache(tab.noteId).name }}</span>
            <span @click.stop="closeTab(group, tab.id)"><XIcon /></span>
          </div>
          <!-- Tab group buttons -->
          <div class="ml-auto flex tab-actions flex-wrap" @click.stop>
            <button type="button" v-if="tabGroups.length > 1" @click="closeTabGroup(group.id)">
              <XIcon />
            </button>
            <template v-if="index === tabGroups.length - 1">
              <button v-if="tabGroups.length > 1" type="button" @click="resetGroupWidths">
                <AlignHorizontalDistributeCenterIcon />
              </button>
              <button type="button" @click="addTabGroup"><Columns2Icon /></button>
            </template>
          </div>
        </div>
        <!-- Tab content -->
        <div v-if="hasActiveNote(group)" class="grow relative overflow-y-auto">
          <EditorContainer :note="getActiveNote(group)!" />
        </div>
        <div v-else class="absolute-center message-xl">No note selected</div>
      </div>
    </div>
  </div>
</template>
