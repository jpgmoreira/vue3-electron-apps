<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['neps'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['neps']);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Score:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.score) }} [{{ toLocaleNumber(meta.stats.score.min!) }} &ndash;
          {{ toLocaleNumber(meta.stats.score.max!) }}].
        </span>
      </li>
      <li>
        Solved by:
        <span class="font-bold">{{ toLocaleNumber(snapshot.solved) }} users.</span>
      </li>
      <li>
        Popularity:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.popularity) }} of
          {{ toLocaleNumber(meta.stats.popularity.max!) }}.
        </span>
      </li>
    </ul>
  </div>
</template>
