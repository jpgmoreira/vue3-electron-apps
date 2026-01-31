<script lang="ts" setup>
  import { onMounted, ref, useTemplateRef, nextTick } from 'vue';
  import MainCard from './MainCard.vue';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useMediaStore } from '@renderer/store/media';
  import { useUIStore } from '@renderer/store/ui';
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';
  const mediaStore = useMediaStore();
  const uiStore = useUIStore();
  const initialScrollTop = uiStore.cardsScrollTop;
  const cards = ref<Card[]>([]);
  const totalHeight = ref(0);
  const isFetching = ref(false);
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollRef = useTemplateRef('scroll-ref');
  async function fetchCards(scrollTop: number) {
    isFetching.value = true;
    const data = await window.api.invoke<GetCardsPageResponseDTO>(
      InvokeChannels.getCardsPage,
      scrollTop
    );
    cards.value = data.page;
    totalHeight.value = data.totalHeight;
    isFetching.value = false;
  }
  function onScroll() {
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(() => {
      if (isFetching.value) return;
      const scroll = scrollRef.value;
      if (!scroll) throw new Error('Scroll not defined!');
      const scrollTop = scroll.scrollTop;
      uiStore.setCardsScrollTop(scrollTop);
      fetchCards(scrollTop);
    }, 30);
  }
  function mediaClick(cardId: string, media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = mediaStore.resolveMediaPath(cardId, media.path);
      const audio = new Audio(mediaPath);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.showMediaModal(cardId, media);
    }
  }
  defineExpose({
    fetchCards,
  });
  onMounted(async () => {
    await fetchCards(initialScrollTop);
    await nextTick();
    if (!scrollRef.value) throw new Error('No scroll ref!');
    scrollRef.value.scrollTop = initialScrollTop;
  });
</script>

<template>
  <div class="grow relative">
    <div
      v-if="cards.length"
      ref="scroll-ref"
      class="absolute inset-0 overflow-auto pb-48"
      @scroll="onScroll"
    >
      <div :style="{ height: `${totalHeight}px` }"></div>
      <div
        v-for="card in cards"
        :key="card.id"
        class="absolute left-0 w-full"
        :style="{ top: `${card.ui.scrollTop}px` }"
      >
        <MainCard :card="card" @media-click="mediaClick" />
      </div>
    </div>
    <div v-else class="absolute-center message-xl">No cards</div>
  </div>
</template>
