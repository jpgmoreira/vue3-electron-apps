<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  import star from '@renderer/assets/images/star.png';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['uva'].snapshot!);
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
