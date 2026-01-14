<script setup lang="ts">
  const props = defineProps<{ to: string }>();
</script>

<template>
  <RouterLink class="nav-btn" :to="props.to">
    <slot></slot>
  </RouterLink>
</template>

<style scoped>
  .nav-btn {
    cursor: pointer;
    padding: 8px;
    transition: background-color 0.2s ease;
  }
</style>
