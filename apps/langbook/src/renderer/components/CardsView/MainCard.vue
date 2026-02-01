<script lang="ts" setup>
  import { useTemplateRef } from 'vue';
  import type { Card } from '@common/schemas/card';
  import type { MediaFile } from '@interapp/types/mediaFile';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  const cardRef = useTemplateRef('card-ref');
  const props = defineProps<{
    card: Card;
    onMediaClick?: (cardId: string, media: MediaFile) => void;
  }>();
  defineExpose({ getHeight });
  function mediaClick(media: MediaFile) {
    if (props.onMediaClick) {
      props.onMediaClick(props.card.id, media);
    }
  }
  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }
  function getHeight() {
    if (!cardRef.value) throw new Error('No card ref!');
    return cardRef.value.offsetHeight;
  }
</script>

<template>
  <div class="main-card whitespace-nowrap flex flex-col" ref="card-ref">
    <div class="card-header flex justify-between">
      <div class="flex gap-1">
        <div>{{ card.ui.position }}</div>
        <div v-if="card.bucket">(Review bucket)</div>
      </div>
      <div>Created at: {{ parseTimestamp(card.createdAt) }}</div>
    </div>
    <div class="card-content" :class="card.frequency">
      <div v-html="card.front" class="mx-1 field"></div>
      <div v-if="card.back" v-html="card.back" class="mx-1"></div>
      <div v-if="card.extra" v-html="card.extra" class="mx-1"></div>
      <div v-if="card.media.length" class="flex">
        <button
          type="button"
          v-for="media in card.media"
          class="media-button m-1"
          :class="mediaButtonClass(media.type)"
          @click="mediaClick(media)"
          v-tooltip="media.name"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main-card :deep(img) {
    display: inline-block;
  }
  .main-card :deep(span) {
    color: inherit;
  }
</style>
