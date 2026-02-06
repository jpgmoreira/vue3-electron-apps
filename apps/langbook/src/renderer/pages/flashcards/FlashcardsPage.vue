<script setup lang="ts">
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import Flashcard from './Flashcard.vue';

  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal, reversed } = storeToRefs(flashcardsStore);

  const hasLoaded = ref(false);
  const card = ref<Card | null>(null);
  const cannotGoPrev = computed(() => index.value === 0 && !reveal.value);

  const router = useRouter();

  async function getFlashcard(id: string | null) {
    return window.api.invoke<Card | null>(InvokeChannels.getFlashcard, id);
  }

  function pushReversed(card: Card) {
    if (card.allowReversed) {
      reversed.value.push(Math.random() < 0.5);
    } else {
      reversed.value.push(false);
    }
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
      pushReversed(next);
      card.value = next;
    }
  }

  async function goPrev() {
    if (reveal.value) {
      reveal.value = false;
      return;
    }
    reveal.value = true;
    index.value--;
    card.value = await getFlashcard(history.value[index.value]);
  }

  function exit() {
    router.back();
  }

  onMounted(async () => {
    if (!history.value.length) {
      const first = await getFlashcard(null);
      card.value = first;
      if (first) {
        history.value.push(first.id);
        pushReversed(first);
      }
      hasLoaded.value = true;
    }
  });
</script>

<template>
  <div class="flashcards-page flex flex-col h-screen">
    <div class="grow relative">
      <Flashcard v-if="card" :card="card" :reveal="reveal" :reversed="reversed[index]" />
      <div v-else-if="hasLoaded" class="absolute-center message-xl">No cards</div>
    </div>
    <footer class="custom-footer flex justify-evenly">
      <button type="button" class="btn-primary" @click="goPrev" :disabled="cannotGoPrev">
        Prev
      </button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="!card">Next</button>
      <button type="button" class="btn-primary" :disabled="!card">Edit</button>
      <button type="button" class="btn-warning" @click="exit">Exit</button>
    </footer>
  </div>
</template>
