<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import { useUIStore } from '@renderer/store/uiStore';
  import Explorer, {
    CreateNodeCallback,
    DeleteNodeCallback,
  } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { NodeType } from '@interapp/components/Explorer/common/tree';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { randomId } from '@interapp/utils/utils';
  import { Note } from '@common/schemas/notes';
  import { Node } from '@interapp/components/Explorer/common/tree';
  import { useProfileStore } from '@renderer/store/profile';
  import NotesModals from './NotesModals.vue';
  import { useTabsStore } from '@renderer/store/tabs';
  import NotesView from '@renderer/components/NotesView/NotesView.vue';

  const uiStore = useUIStore();
  const profileStore = useProfileStore();
  const tabsStore = useTabsStore();

  const resizing = ref(false);
  const explorerWidth = ref(uiStore.settings.explorerWidth);

  const initialExplorerScrollTop = uiStore.settings.explorerScrollTop;

  const modalsRef = useTemplateRef('modals');

  function explorerScroll(scrollTop: number) {
    uiStore.updateSettings({ explorerScrollTop: scrollTop });
  }

  function explorerNodeClick(node: Node) {
    if (node.type === 'file') {
      tabsStore.explorerNoteClicked(node.id);
    }
  }

  async function beforeCreateNode(type: NodeType, callback: CreateNodeCallback) {
    if (type === 'dir') {
      const number = await window.api.invoke<number>(InvokeChannels.createFolder);
      const name = `Folder ${number}`;
      const id = randomId();
      callback(id, name);
    } else {
      const note = await window.api.invoke<Note>(InvokeChannels.createNote);
      await callback(note.id, note.name);
      await profileStore.refetch();
    }
  }

  async function deletionHappened() {
    await profileStore.refetch();
    await tabsStore.refetch();
  }

  async function beforeDeleteNode(node: Node, callback: DeleteNodeCallback) {
    modalsRef.value?.showDeleteSingle(node, callback);
  }
  async function beforeDeleteMultiple(
    files: number,
    folders: number,
    callback: DeleteNodeCallback
  ) {
    modalsRef.value?.showDeleteMultiple(files, folders, callback);
  }

  function windowMouseMove(e: MouseEvent) {
    if (!resizing.value) return;
    const { clientX } = e;
    if (clientX < 0 || clientX > window.innerWidth) {
      return;
    }
    explorerWidth.value = clientX;
    uiStore.updateSettings({ explorerWidth: clientX });
  }
  function windowMouseUp() {
    resizing.value = false;
  }
  onMounted(async () => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="notes-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <Header />
    <NotesModals ref="modals" @deleted="deletionHappened" />
    <div class="flex grow">
      <div :style="{ width: `${explorerWidth}px` }">
        <Explorer
          file-icon
          :initial-scroll-top="initialExplorerScrollTop"
          @scroll="explorerScroll"
          @before-create-node="beforeCreateNode"
          @before-delete-node="beforeDeleteNode"
          @before-delete-selected="beforeDeleteMultiple"
          @node-click="explorerNodeClick"
        />
      </div>
      <div class="custom-resizer" @mousedown="resizing = true"></div>
      <div class="grow relative">
        <NotesView />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .notes-page.resizing {
    cursor: col-resize;
  }
</style>
