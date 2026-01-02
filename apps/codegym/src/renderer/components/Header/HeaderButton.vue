<script setup lang="ts">
  const props = defineProps<{ to: string }>();
</script>

<template>
  <RouterLink :to="props.to">
    <slot></slot>
  </RouterLink>
</template>

<style scoped>
  a {
    cursor: pointer;
    padding: 8px;
    transition: background-color 0.2s ease;
  }
</style>
