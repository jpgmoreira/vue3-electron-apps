<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { NodeType } from '@interapp/components/Explorer/common/tree';
  import { useUIStore } from '@renderer/store/ui';
  import Header from '@renderer/components/Header.vue';
  import Explorer, {
    CreateNodeCallback,
  } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { randomId } from '@interapp/utils/utils';
  import { Session } from '@common/schemas/session';
  const uiStore = useUIStore();
  const resizing = ref(false);
  const explorerWidth = ref(uiStore.settings.explorerWidth);
  const initialExplorerScroll = ref(uiStore.settings.explorerScrollTop);
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
  function explorerScroll(scrollTop: number) {
    uiStore.updateSettings({ explorerScrollTop: scrollTop });
  }
  async function beforeCreateNode(type: NodeType, callback: CreateNodeCallback) {
    if (type === 'dir') {
      const number = await window.api.invoke<number>(InvokeChannels.createFolder);
      const name = `Folder ${number}`;
      const id = randomId();
      callback(id, name);
    } else {
      const session = await window.api.invoke<Session>(InvokeChannels.createSession);
      callback(session.id, session.name);
    }
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
  <div class="cards-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <Header />
    <div class="flex grow">
      <div :style="{ width: `${explorerWidth}px` }">
        <Explorer
          file-icon
          checkbox
          :initial-scroll-top="initialExplorerScroll"
          @scroll="explorerScroll"
          @before-create-node="beforeCreateNode"
        />
      </div>
      <div class="custom-resizer" @mousedown="resizing = true"></div>
    </div>
  </div>
</template>

<style scoped>
  .cards-page.resizing {
    cursor: col-resize;
  }
</style>
