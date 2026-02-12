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
    <div class="color-container" :class="{ active }">
      <div
        class="color-box"
        v-for="color in MD_EDITOR_COLORS"
        :key="color"
        :style="{ background: color }"
        @click="emit('select', color)"
      ></div>
    </div>
  </NormalToolbar>
</template>
