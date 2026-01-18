<script lang="ts" setup>
  import { ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import Explorer, {
    CreateNodeCallback,
    DeleteNodeCallback,
  } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { Node, NodeType } from '@interapp/components/Explorer/common/tree';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { randomId } from '@interapp/utils/utils';
  import { Contest } from '@common/schemas/contests';
  import { ModifierKeys } from '@interapp/types/modifierKeys';
  import { useUIStore } from '@renderer/store/ui';
  import DeleteModals from './DeleteModals.vue';
  import ContestComponent from './Contest.vue';
  const uiStore = useUIStore();
  const modals = useTemplateRef('modals');
  const currContest = ref<Contest | null>(null);
  const resizing = ref(false);
  const explorerWidth = ref(200);
  async function beforeCreateNode(type: NodeType, callback: CreateNodeCallback) {
    if (type === 'dir') {
      const number = await window.api.invoke<number>(InvokeChannels.createFolder);
      const name = `Folder ${number}`;
      const id = randomId();
      callback(id, name);
    } else {
      const contest = await window.api.invoke<Contest>(InvokeChannels.createContest);
      callback(contest.id, contest.name);
    }
  }
  function beforeDeleteNode(node: Node, callback: DeleteNodeCallback) {
    if (!modals.value) throw new Error('Invalid modals!');
    modals.value.showDeleteSingle(node, callback);
  }
  function beforeDeleteMultiple(files: number, folders: number, callback: DeleteNodeCallback) {
    if (!modals.value) throw new Error('Invalid modals!');
    modals.value.showDeleteMultiple(files, folders, callback);
  }
  async function contestDeleted() {
    if (!currContest.value) return;
    const contestId = currContest.value.id;
    const result = await window.api.invoke<boolean>(InvokeChannels.contestExists, contestId);
    if (!result) {
      currContest.value = null;
      uiStore.updateSettings({ currContestId: null });
    }
  }
  async function getContest(contestId: string) {
    const contest = await window.api.invoke<Contest>(InvokeChannels.getContest, contestId);
    currContest.value = contest;
  }
  async function nodeClick(node: Node, keys: ModifierKeys) {
    if (node.type === 'dir' || keys.ctrl) return;
    await getContest(node.id);
    uiStore.updateSettings({ currContestId: node.id });
  }
  async function renameContest(contestId: string, newName: string) {
    newName = newName.trim();
    await window.api.invoke(InvokeChannels.renameContest, contestId, newName);
    if (currContest.value && currContest.value.id === contestId) {
      currContest.value.name = newName;
    }
  }
  function windowMouseMove(e: MouseEvent) {
    if (!resizing.value) return;
    const { clientX } = e;
    if (clientX < 0 || clientX > window.innerWidth) {
      return;
    }
    explorerWidth.value = clientX;
  }
  function windowMouseUp() {
    resizing.value = false;
  }
  onMounted(async () => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
    const currContestId = uiStore.settings.currContestId;
    if (currContestId) getContest(currContestId);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="contests-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <SettingsPageHeader />
    <DeleteModals ref="modals" @deleted="contestDeleted" />
    <div class="flex grow">
      <div :style="{ width: `${explorerWidth}px` }">
        <Explorer
          file-icon
          @before-create-node="beforeCreateNode"
          @node-click="nodeClick"
          @rename-file="renameContest"
          @before-delete-node="beforeDeleteNode"
          @before-delete-selected="beforeDeleteMultiple"
        />
      </div>
      <div class="custom-resizer" @mousedown="resizing = true"></div>
      <div class="grow relative overflow-y-auto">
        <div class="absolute inset-0">
          <div v-if="currContest" class="pb-24">
            <ContestComponent :currContest="currContest" />
          </div>
          <div v-else class="absolute-center message-xl">No contest selected</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .contests-page.resizing {
    cursor: col-resize;
  }
</style>
