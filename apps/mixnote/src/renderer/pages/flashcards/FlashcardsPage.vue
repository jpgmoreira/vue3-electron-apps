<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { useStatisticsStore } from '@renderer/store/statistics';
  import { storeToRefs } from 'pinia';
  import { Note } from '@common/schemas/notes';
  import { InvokeChannels } from '@preload/channels/invoke';
  import Flashcard from './Flashcard.vue';

  const router = useRouter();

  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal } = storeToRefs(flashcardsStore);

  const statisticsStore = useStatisticsStore();
  const statistics = computed(() => statisticsStore.statistics);

  const seen = computed(() => new Set(history.value).size);

  const hasLoaded = ref(false);
  const isEditing = ref(false);

  const note = ref<Note | null>(null);
  const cannotGoPrev = computed(() => {
    if (history.value.length) {
      return index.value === 0 && !reveal.value;
    }
    return true;
  });

  async function getFlashcard(id: string | null): Promise<Note | null> {
    return window.api.invoke<Note | null>(InvokeChannels.getFlashcard, id);
  }

  async function goNext() {
    if (!reveal.value) {
      reveal.value = true;
      return;
    }
    reveal.value = false;
    if (index.value < history.value.length - 1) {
      index.value++;
      note.value = await getFlashcard(history.value[index.value]);
      return;
    }
    const next = await getFlashcard(null);
    if (next) {
      index.value++;
      history.value.push(next.id);
    }
    note.value = next;
  }

  async function goPrev() {
    if (reveal.value) {
      reveal.value = false;
      return;
    }
    reveal.value = true;
    index.value--;
    note.value = await getFlashcard(history.value[index.value]);
  }

  function startEdit() {
    isEditing.value = true;
  }

  function exit() {
    router.back();
  }

  async function recomputeQueues() {
    await window.api.invoke(InvokeChannels.recomputeQueues);
  }

  onMounted(async () => {
    await recomputeQueues();
    const isFirst = history.value.length === 0;
    const id = isFirst ? null : history.value[index.value];
    note.value = await getFlashcard(id);
    if (isFirst && note.value) {
      history.value.push(note.value.id);
    }
    hasLoaded.value = true;
    statisticsStore.refetch();
  });
</script>

<template>
  <div class="flashcards-page flex flex-col h-screen select-none">
    <div class="grow relative">
      <div v-if="note" class="absolute inset-0 overflow-hidden">
        <Flashcard :note="note" :reveal="reveal" :is-editing="isEditing" />
      </div>
      <div v-else-if="hasLoaded" class="absolute-center message-xl">No notes</div>
    </div>
    <div v-if="note" class="flashcards-info">
      <div>Seen: {{ seen }}</div>
      <div>Total: {{ statistics.filtered }}</div>
      <div>High: {{ statistics.filteredHigh }}</div>
      <div>Low: {{ statistics.filteredLow }}</div>
      <div>Normal: {{ statistics.filteredNormal }}</div>
      <div>Bucket: {{ statistics.filteredBucket }}</div>
    </div>
    <footer class="custom-footer flex justify-evenly">
      <button type="button" class="btn-primary" @click="goPrev" :disabled="cannotGoPrev">
        Prev
      </button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="!note">Next</button>
      <button type="button" class="btn-primary" :disabled="!note" @click="startEdit">Edit</button>
      <button type="button" class="btn-warning" @click="exit">Exit</button>
    </footer>
  </div>
</template>
