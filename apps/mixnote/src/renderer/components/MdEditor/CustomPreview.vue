<script setup lang="ts">
  defineProps<{
    html: string;
    id?: string;
    className?: string;
  }>();
</script>

<template>
  <div :id="id" :class="className" v-html="html" />
</template>
