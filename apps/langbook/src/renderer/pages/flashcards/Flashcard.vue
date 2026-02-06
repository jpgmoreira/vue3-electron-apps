<script setup lang="ts">
  import { computed } from 'vue';
  import { Card } from '@common/schemas/card';

  const props = defineProps<{
    card: Card;
    reveal: boolean;
    reversed: boolean;
  }>();

  const front = computed(() => (props.reversed ? props.card.back : props.card.front));
  const back = computed(() => (props.reversed ? props.card.front : props.card.back));

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
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
        v-tooltip="m.name"
      ></button>
    </div>
  </div>
</template>
