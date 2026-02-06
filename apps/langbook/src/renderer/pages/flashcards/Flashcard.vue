<script setup lang="ts">
  import { computed } from 'vue';
  import { Card } from '@common/schemas/card';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useUIStore } from '@renderer/store/ui';

  const props = defineProps<{
    card: Card;
    reveal: boolean;
    flip: boolean;
  }>();

  const uiStore = useUIStore();

  const front = computed(() => (props.flip ? props.card.back : props.card.front));
  const back = computed(() => (props.flip ? props.card.front : props.card.back));

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }

  function mediaClick(media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const audio = new Audio(media.path);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.showMediaModal(media);
    }
  }
</script>

<template>
  <div>
    <div v-html="front"></div>
    <div v-if="back && reveal" v-html="card.back"></div>
    <div v-if="card.extra && reveal" v-html="card.extra"></div>
    <div v-if="card.media.length && reveal">
      <button
        type="button"
        v-for="m in card.media"
        class="media-button m-1"
        :class="mediaButtonClass(m.type)"
        @click="mediaClick(m)"
        v-tooltip="m.name"
      ></button>
    </div>
  </div>
</template>
