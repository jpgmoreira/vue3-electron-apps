<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjContextStore } from '@renderer/store/ojContext';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@interapp/utils/utils';
  const ojContextStore = useOjContextStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => ojContextStore.context['leetcode'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['leetcode']);
  const difficultyList = ['Easy', 'Medium', 'Hard'];
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Accepted:
        <span class="font-bold">{{ toLocaleNumber(snapshot.accepted) }}.</span>
      </li>
      <li>
        Submissions:
        <span class="font-bold">{{ toLocaleNumber(snapshot.submissions) }}.</span>
      </li>
      <li>
        Popularity:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.popularity) }} of
          {{ toLocaleNumber(meta.stats.popularity.max!) }}.
        </span>
      </li>
      <li>
        Difficulty:
        <span class="font-bold">{{ difficultyList[snapshot.difficulty - 1] }}.</span>
      </li>
      <li>
        Premium:
        <span class="font-bold">{{ snapshot.premium ? 'Yes' : 'No' }}.</span>
      </li>
    </ul>
  </div>
</template>
