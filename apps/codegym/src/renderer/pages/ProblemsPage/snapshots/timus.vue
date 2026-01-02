<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['timus'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['timus']);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Difficulty:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.difficulty) }} [{{
            toLocaleNumber(meta.stats.difficulty.min!)
          }}
          &ndash; {{ toLocaleNumber(meta.stats.difficulty.max!) }}].
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
      <li v-if="snapshot.source">
        Source:
        <span class="font-bold">{{ snapshot.source }}.</span>
      </li>
    </ul>
  </div>
</template>
