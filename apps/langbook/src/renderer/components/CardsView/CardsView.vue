<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  import MainCard from './MainCard.vue';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useMediaStore } from '@renderer/store/media';
  import { useUIStore } from '@renderer/store/ui';
  const mediaStore = useMediaStore();
  const uiStore = useUIStore();
  const props = defineProps<{
    page: Card[];
  }>();
  function mediaClick(cardId: string, media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = mediaStore.resolveMediaPath(cardId, media.path);
      const audio = new Audio(mediaPath);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.showMediaModal(cardId, media);
    }
  }
</script>

<template>
  <div class="overflow-auto pb-48">
    <div v-for="card in page" :key="card.id">
      <MainCard :card="card" @media-click="mediaClick" />
    </div>
  </div>
</template>
