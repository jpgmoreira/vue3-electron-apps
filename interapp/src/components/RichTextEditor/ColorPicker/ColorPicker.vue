<script lang="ts" setup>
  import { COLORS } from './colors';
  const emit = defineEmits<{
    (e: 'select', color: string): void;
  }>();
</script>

<template>
  <div class="color-picker">
    <div
      class="color-box"
      v-for="color in COLORS"
      :key="color"
      :style="{ background: color }"
      @mousedown.prevent.stop="emit('select', color)"
    ></div>
  </div>
</template>
