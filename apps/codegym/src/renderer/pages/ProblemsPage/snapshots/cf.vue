<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['cf'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['cf']);
  const showTags = ref(false);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li v-if="snapshot.rating !== null">
        Rating:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.rating) }} [{{
            toLocaleNumber(meta.stats.rating.min!)
          }}
          &ndash; {{ toLocaleNumber(meta.stats.rating.max!) }}].
        </span>
      </li>
      <li>
        Solved by:
        <span class="font-bold">{{ toLocaleNumber(snapshot.solved) }} users.</span>
      </li>
      <li>
        Popularity:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.popularity!) }} of
          {{ toLocaleNumber(meta.stats.popularity.max!) }}.
        </span>
      </li>
      <li v-if="snapshot.tags && snapshot.tags.length">
        <div class="inline-flex items-center">
          Tags:
          <span
            class="leading-tight text-lg ms-1.5 cursor-pointer transition-transform"
            :class="{ 'rotate-180': showTags }"
            @click="showTags = !showTags"
          >
            &#9662;
          </span>
        </div>
        <div v-if="showTags" class="tags-container flex flex-wrap gap-1 border rounded-md p-1">
          <span v-for="tag in snapshot.tags" :key="tag" class="tag-badge">{{ tag }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
