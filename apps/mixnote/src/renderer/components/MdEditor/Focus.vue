<script lang="ts" setup>
  import { NormalToolbar } from 'md-editor-v3';
  import { FocusIcon } from 'lucide-vue-next';
  const emit = defineEmits<{ (e: 'toggle'): void }>();
</script>

<template>
  <NormalToolbar title="Focus" @click="emit('toggle')">
    <FocusIcon class="md-editor-icon" />
  </NormalToolbar>
</template>
