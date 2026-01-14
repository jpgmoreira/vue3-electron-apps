<script setup lang="ts">
  const props = defineProps<{ to: string }>();
</script>

<template>
  <RouterLink class="nav-btn" :to="props.to">
    <slot></slot>
  </RouterLink>
</template>
