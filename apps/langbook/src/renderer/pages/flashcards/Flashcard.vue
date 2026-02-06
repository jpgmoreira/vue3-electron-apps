<script setup lang="ts">
  import { Card } from '@common/schemas/card';

  const props = defineProps<{
    card: Card;
    reveal: boolean;
    reversed: boolean;
  }>();

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }
</script>

<template>
  <div>
    <div v-html="card.front"></div>
    <div v-if="card.back && reveal" v-html="card.back"></div>
    <div v-if="card.extra && reveal" v-html="card.extra"></div>
    <div v-if="card.media.length && reveal">
      <button
        type="button"
        v-for="m in card.media"
        class="media-button m-1"
        :class="mediaButtonClass(m.type)"
        v-tooltip="m.name"
      ></button>
    </div>
  </div>
</template>
