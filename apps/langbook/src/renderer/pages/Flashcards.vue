<script setup lang="ts">
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { storeToRefs } from 'pinia';
  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal } = storeToRefs(flashcardsStore);
</script>

<template></template>
