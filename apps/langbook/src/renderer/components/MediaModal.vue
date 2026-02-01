<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useUIStore } from '@renderer/store/ui';
  const uiStore = useUIStore();
  const media = computed(() => uiStore.mediaModal.media);
  const visible = computed(() => uiStore.mediaModal.visible);
  const scale = ref(1);
  const style = computed(() => ({
    transform: `translate(-50%, -50%) scale(${scale.value})`,
  }));
  function onWheel(e: WheelEvent) {
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = scale.value * factor;
    scale.value = Math.min(5, Math.max(0.2, newScale));
  }
  function onClick() {
    uiStore.hideMediaModal();
  }
  watch(
    () => visible.value,
    () => {
      scale.value = 1;
    },
    { deep: true }
  );
</script>

<template>
  <teleport to="body">
    <Transition name="media-modal-transition">
      <div
        v-if="media && visible"
        class="media-modal-parent"
        @wheel.prevent="onWheel"
        @click="onClick"
      >
        <div class="modal-backdrop"></div>
        <div class="media-modal" :style="style">
          <img :src="media.path" />
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<style scoped>
  .media-modal-transition-enter-active,
  .media-modal-transition-leave-active {
    transition: opacity 0.1s ease;
  }
  .media-modal-transition-enter-from,
  .media-modal-transition-leave-to {
    opacity: 0;
  }
  .media-modal-transition-enter-to,
  .media-modal-transition-leave-from {
    opacity: 1;
  }
</style>
