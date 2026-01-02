<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  import star from '@renderer/assets/images/star.png';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['kattis'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['kattis']);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li v-if="snapshot.difficulty !== null">
        Difficulty:
        <span class="font-bold">
          {{ snapshot.textDifficulty }} [{{ toLocaleNumber(meta.stats.difficulty.min!) }} &ndash;
          {{ toLocaleNumber(meta.stats.difficulty.max!) }}].
        </span>
      </li>
      <li>
        Popularity:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.popularity) }} of
          {{ toLocaleNumber(meta.stats.popularity.max!) }}.
        </span>
      </li>
      <li>
        Solved by:
        <span class="font-bold">{{ toLocaleNumber(snapshot.solved) }} users.</span>
      </li>
      <li>
        Users submitted:
        <span class="font-bold">{{ toLocaleNumber(snapshot.submissions) }}.</span>
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
