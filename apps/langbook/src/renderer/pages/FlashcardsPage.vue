<script setup lang="ts">
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal } = storeToRefs(flashcardsStore);
  const card = ref<Card | null>(null);
  const cannotGoPrev = computed(() => index.value === 0 && !reveal.value);

  const router = useRouter();

  async function getFlashcard(id: string | null) {
    return window.api.invoke<Card | null>(InvokeChannels.getFlashcard, id);
  }

  async function goNext() {
    if (!reveal.value) {
      reveal.value = true;
      return;
    }
    reveal.value = false;
    if (index.value < history.value.length - 1) {
      index.value++;
      card.value = await getFlashcard(history.value[index.value]);
      return;
    }
    const next = await getFlashcard(null);
    if (next) {
      index.value++;
      history.value.push(next.id);
      card.value = next;
    }
  }

  function exit() {
    router.back();
  }

  onMounted(async () => {
    if (!history.value.length) {
      const first = await getFlashcard(null);
      card.value = first;
      if (first) history.value.push(first.id);
    }
  });
</script>

<template>
  <div class="flashcards-page flex flex-col h-screen">
    <div class="grow relative">
      <div v-if="card">
        <div v-html="card.front"></div>
        <div v-if="card.back && reveal" v-html="card.back"></div>
        <div v-if="card.extra && reveal" v-html="card.extra"></div>
      </div>
      <div v-else class="absolute-center message-xl">No cards</div>
    </div>
    <footer class="custom-footer flex justify-evenly">
      <button type="button" class="btn-primary" :disabled="cannotGoPrev">Prev</button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="!card">Next</button>
      <button type="button" class="btn-primary" :disabled="!card">Edit</button>
      <button type="button" class="btn-warning" @click="exit">Exit</button>
    </footer>
  </div>
</template>
