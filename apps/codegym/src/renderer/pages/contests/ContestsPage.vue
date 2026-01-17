<script lang="ts" setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import Explorer from '@interapp/components/Explorer/renderer/Explorer.vue';
  const resizing = ref(false);
  const explorerWidth = ref(200);
  const mainWidth = computed(() => window.innerWidth - explorerWidth.value);
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
        <Explorer />
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
