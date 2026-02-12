<script lang="ts" setup>
  import { NormalToolbar } from 'md-editor-v3';
  import { PaletteIcon } from 'lucide-vue-next';
  import { ref } from 'vue';
  import { MD_EDITOR_COLORS } from './colors';

  const emit = defineEmits<{
    (e: 'select', color: string): void;
  }>();

  const active = ref(false);
</script>

<template>
  <NormalToolbar
    title="Color picker"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @click="active = false"
  >
    <PaletteIcon class="md-editor-icon" />
    <Transition name="fade">
      <div class="color-container" v-if="active">
        <div
          class="color-box"
          v-for="color in MD_EDITOR_COLORS"
          :key="color"
          :style="{ background: color }"
          @click="emit('select', color)"
        ></div>
      </div>
    </Transition>
  </NormalToolbar>
</template>

<style scoped>
  .color-container {
    border: 1px solid var(--md-border-color);
    background-color: var(--md-bk-color);
    border-radius: 4px;
    top: 21px;
    width: 103px;
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    padding: 3px;
    max-height: 150px;
    overflow-y: auto;
    position: absolute;
    z-index: 20000;
  }
  .color-box {
    width: 20px;
    height: 20px;
  }
  .color-container::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
</style>
