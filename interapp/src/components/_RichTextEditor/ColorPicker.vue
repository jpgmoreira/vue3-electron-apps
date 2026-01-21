<script lang="ts" setup>
  import { computed } from 'vue';
  const emit = defineEmits<{
    (e: 'select', color: string): void;
  }>();
  const colors = Object.freeze([
    // red:
    '#7f1d1d',
    '#b91c1c',
    '#ef4444',
    '#fca5a5',
    // blue:
    '#1e40af',
    '#2563eb',
    '#60a5fa',
    '#bfdbfe',
    // yellow:
    '#a16207',
    '#eab308',
    '#fde047',
    '#fef9c3',
    // orange:
    '#9a3412',
    '#ea580c',
    '#fb923c',
    '#fed7aa',
    // cyan:
    '#155e75',
    '#0891b2',
    '#22d3ee',
    '#a5f3fc',
    // green:
    '#14532d',
    '#15803d',
    '#22c55e',
    '#bbf7d0',
    // lime:
    '#3f6212',
    '#65a30d',
    '#a3e635',
    '#d9f99d',
    // pink:
    '#9d174d',
    '#db2777',
    '#f472b6',
    '#fbcfe8',
    // purple:
    '#6b21a8',
    '#9333ea',
    '#c084fc',
    '#e9d5ff',
    // gray:
    '#1f2937',
    '#4b5563',
    '#9ca3af',
    '#e5e7eb',
    // default:
    '#ededf0',
    '#222',
    '#000',
    '#fff',
    // primary:
    'red',
    'green',
    'blue',
    'yellow',
  ]);
  const chunkedColors = computed(() => {
    const chunks = [] as string[][];
    for (let i = 0; i < colors.length; i += 4) {
      chunks.push(colors.slice(i, i + 4));
    }
    return chunks;
  });
</script>

<template>
  <div class="color-picker">
    <div class="color-row" v-for="(group, i) in chunkedColors" :key="`${group[i]}-${i}`">
      <div
        class="color-box"
        v-for="color in group"
        :key="color"
        :style="{ background: color }"
        @mousedown.prevent.stop="emit('select', color)"
      ></div>
    </div>
  </div>
</template>
