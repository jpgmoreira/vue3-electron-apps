<script lang="ts" setup>
  import { computed } from 'vue';
  import cf from './filters/cf.vue';
  import kattis from './filters/kattis.vue';
  import leetcode from './filters/leetcode.vue';
  import neps from './filters/neps.vue';
  import timus from './filters/timus.vue';
  import uva from './filters/uva.vue';
  import { toLocaleNumber } from '@common/utils/utils';
  import { Oj } from '@common/types/oj';
  import { OjContext } from '@common/schemas/ojContext';
  const props = defineProps<{
    currOj: Oj;
    ojContext: OjContext;
  }>();
  const hasEverFiltered = computed(() => props.ojContext[props.currOj].hasEverFiltered);
  const matched = computed(() => props.ojContext[props.currOj].matched);
  const mapping = {
    cf,
    kattis,
    leetcode,
    neps,
    timus,
    uva,
  };
</script>

<template>
  <div class="filters flex flex-col p-3">
    <component :is="mapping[currOj]" class="flex-1" />
    <div v-if="hasEverFiltered" class="font-bold">
      {{ toLocaleNumber(matched) }} problems matched.
    </div>
  </div>
</template>
