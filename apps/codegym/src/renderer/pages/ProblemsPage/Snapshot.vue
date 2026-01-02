<script lang="ts" setup>
  import { computed } from 'vue';
  import cf from './snapshots/cf.vue';
  import kattis from './snapshots/kattis.vue';
  import leetcode from './snapshots/leetcode.vue';
  import neps from './snapshots/neps.vue';
  import timus from './snapshots/timus.vue';
  import uva from './snapshots/uva.vue';
  import { handleProblemClick } from '../../utils/utils';
  import { OjProblem } from '@common/schemas/problems';
  import { Oj } from '@common/types/oj';
  import { OjContext } from '@common/schemas/ojContext';
  const props = defineProps<{
    currOj: Oj;
    ojContext: OjContext;
    snapshot: OjProblem[Oj] | null;
  }>();
  const hasEverFiltered = computed(() => props.ojContext[props.currOj].hasEverFiltered);
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
  <div v-if="snapshot" class="snapshot p-3">
    <a
      href="#"
      class="block text-center text-2xl outline-none pb-3"
      @click="handleProblemClick(snapshot)"
    >
      {{ snapshot.name || '\<no name available\>' }}
    </a>
    <component :is="mapping[currOj]" />
  </div>
  <div v-else class="flex items-center justify-center text-xl">
    <span v-if="hasEverFiltered" class="opacity-70">No problem satisfy the current filters</span>
    <span v-else class="opacity-70">Click on New Problem</span>
  </div>
</template>
