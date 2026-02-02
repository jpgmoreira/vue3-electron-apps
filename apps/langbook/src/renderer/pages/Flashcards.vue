<script setup lang="ts">
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { storeToRefs } from 'pinia';
  import { onMounted, ref } from 'vue';
  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal } = storeToRefs(flashcardsStore);
  const card = ref<Card | null>(null);
  async function getFlashcard(id: string | null) {
    return window.api.invoke<Card | null>(InvokeChannels.getFlashcard, id);
  }
  onMounted(async () => {
    if (!history.value.length) {
      card.value = await getFlashcard(null);
    }
  });
</script>

<template></template>
