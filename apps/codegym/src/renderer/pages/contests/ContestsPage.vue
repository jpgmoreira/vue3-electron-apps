<script lang="ts" setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import Explorer, {
    CreateNodeCallback,
  } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { Node, NodeType } from '@interapp/components/Explorer/common/tree';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { randomId } from '@interapp/utils/utils';
  import { Contest } from '@common/schemas/contests';
  import { ModifierKeys } from '@interapp/types/modifierKeys';
  const resizing = ref(false);
  const explorerWidth = ref(200);
  const mainWidth = computed(() => window.innerWidth - explorerWidth.value);
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
  function nodeClick(node: Node, keys: ModifierKeys) {
    if (node.type === 'dir' || keys.ctrl) return;
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
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="contests-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <SettingsPageHeader />
    <div class="flex grow">
      <div style="border: 1px solid red" :style="{ width: `${explorerWidth}px` }">
        <Explorer file-icon @before-create-node="beforeCreateNode" @node-click="nodeClick" />
      </div>
      <div class="custom-resizer" @mousedown="resizing = true"></div>
      <div :style="{ width: `${mainWidth}px` }"></div>
    </div>
  </div>
</template>

<style scoped>
  .contests-page.resizing {
    cursor: col-resize;
  }
</style>
