<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjContextStore } from '@renderer/store/ojContext';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@interapp/utils/utils';
  import star from '@renderer/assets/images/star.png';
  const ojContextStore = useOjContextStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => ojContextStore.context['uva'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['uva']);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Distinct users accepted:
        <span class="font-bold">{{ toLocaleNumber(snapshot.dacu) }}.</span>
      </li>
      <li>
        Popularity:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.popularity) }} of
          {{ toLocaleNumber(meta.stats.popularity.max!) }}.
        </span>
      </li>
      <div v-if="snapshot.starred">
        <img :src="star" class="star" />
      </div>
    </ul>
  </div>
</template>

<style scoped>
  .star {
    width: 38px;
  }
</style>
