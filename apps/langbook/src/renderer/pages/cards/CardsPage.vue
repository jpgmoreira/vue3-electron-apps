<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { useUIStore } from '@renderer/store/ui';
  import Header from '@renderer/components/Header.vue';
  import Explorer from '@interapp/components/Explorer/renderer/Explorer.vue';
  const uiStore = useUIStore();
  const resizing = ref(false);
  const explorerWidth = ref(uiStore.settings.explorerWidth);
  const explorerScrollTop = ref(uiStore.settings.explorerScrollTop);
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
  <div class="cards-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <Header />
    <div class="flex grow">
      <div :style="{ width: `${explorerWidth}px` }">
        <Explorer />
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
