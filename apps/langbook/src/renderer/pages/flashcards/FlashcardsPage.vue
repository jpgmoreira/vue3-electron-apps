<script setup lang="ts">
  import { Card, CardFrequency } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useFlashcardsStore } from '@renderer/store/flashcards';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted, ref, reactive, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import Flashcard from './Flashcard.vue';
  import { clamp, cloneDeep } from '@interapp/utils/utils';
  import { useStatisticsStore } from '@renderer/store/statistics';

  const flashcardsStore = useFlashcardsStore();
  const { history, index, reveal, reversed } = storeToRefs(flashcardsStore);

  const statisticsStore = useStatisticsStore();
  const statistics = computed(() => statisticsStore.statistics);

  const seen = computed(() => new Set(history.value).size);

  const hasLoaded = ref(false);
  const card = ref<Card | null>(null);
  const cannotGoPrev = computed(() => index.value === 0 && !reveal.value);

  const router = useRouter();

  const position = reactive({
    top: 0,
    left: 0,
    scale: 1,
  });

  const cardStyle = computed(() => {
    const { top, left, scale } = position;
    return {
      transform: `translate(${left}px, ${top}px) scale(${scale})`,
    };
  });

  const isMoving = ref(false);

  function resetPosition() {
    position.top = 0;
    position.left = 0;
    position.scale = 1;
  }

  async function getFlashcard(id: string | null): Promise<Card | null> {
    const flashcard = await window.api.invoke<Card | null>(InvokeChannels.getFlashcard, id);
    if (flashcard) {
      flashcard.bucket = Boolean(flashcard.bucket);
      flashcard.allowReversed = Boolean(flashcard.allowReversed);
    }
    return flashcard;
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
    }
    card.value = next;
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

  async function updateBucket() {
    if (!card.value) throw new Error('Toggle bucket: invalid card!');
    await window.api.invoke(InvokeChannels.updateCard, cloneDeep(card.value));
    statisticsStore.refetch();
  }

  async function changeFrequency(frequency: CardFrequency) {
    if (!card.value) throw new Error('Change frequency: invalid card!');
    card.value.frequency = frequency;
    await window.api.invoke(InvokeChannels.updateCard, cloneDeep(card.value));
    statisticsStore.refetch();
  }

  function wheel(e: WheelEvent) {
    e.preventDefault();
    const minScale = 0.1;
    const maxScale = 1000;
    // finer control when CTRL is pressed
    const factor = e.ctrlKey ? 2500 : 1000;
    // use a relative scale change (so zoom speed is proportional to current scale)
    const delta = -e.deltaY / factor;
    const newScale = clamp(minScale, maxScale, position.scale * (1 + delta));
    const mx = e.clientX;
    const my = e.clientY;
    const oldScale = position.scale;
    // convert mouse screen coords to element-local coords (assuming transform origin at 0,0)
    const localX = (mx - position.left) / oldScale;
    const localY = (my - position.top) / oldScale;
    // keep the same local point under the mouse after scaling
    position.left = mx - localX * newScale;
    position.top = my - localY * newScale;
    position.scale = newScale;
  }

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      resetPosition();
    }
  }
  function windowMouseUp() {
    isMoving.value = false;
  }
  function windowMouseMove(e: MouseEvent) {
    if (!isMoving.value) return;
    position.left += e.movementX;
    position.top += e.movementY;
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
    statisticsStore.refetch();
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="flashcards-page flex flex-col h-screen select-none">
    <div class="grow relative">
      <div
        v-if="card"
        class="absolute inset-0 overflow-hidden"
        :class="isMoving ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="isMoving = true"
        @wheel="wheel"
      >
        <div class="flashcard-parent absolute w-full" :style="cardStyle">
          <Flashcard
            :card="card"
            :reveal="reveal"
            :flip="reversed[index]"
            @update-bucket="updateBucket"
            @change-frequency="changeFrequency"
          />
        </div>
        <div class="flashcards-info">
          <div>Seen: {{ seen }}</div>
          <div>Total: {{ statistics.filtered }}</div>
          <div>Review bucket: {{ statistics.filteredBucket }}</div>
        </div>
      </div>
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

<style scoped>
  .flashcard-parent {
    transform-origin: 0 0;
  }
</style>
