<script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { useUIStore } from '@renderer/store/ui';
  import { useOjContextStore } from '@renderer/store/ojContext';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import ProblemsPageHeader from '@renderer/components/header/ProblemsPageHeader.vue';
  import Filters from './Filters.vue';
  import Snapshot from './Snapshot.vue';
  const uiStore = useUIStore();
  const ojContextStore = useOjContextStore();
  const ojStatusStore = useOjStatusStore();
  const currOj = computed(() => uiStore.settings.currOj);
  const ojContext = computed(() => ojContextStore.context);
  const snapshot = computed(() => ojContext.value[currOj.value].snapshot);
  const isRequestingProblem = computed(() => ojStatusStore[currOj.value].isRequestingProblem);
  const isUpdatingCache = computed(() => ojStatusStore[currOj.value].isUpdatingCache);
  const isBusy = computed(() => isRequestingProblem.value || isUpdatingCache.value);
  const btnText = computed(() => {
    if (isUpdatingCache.value) return 'Updating cache';
    return 'New problem';
  });
  const isSolved = ref(Boolean(snapshot.value?.solvedDate));
  function newProblem() {
    ojContextStore.requestNewProblem(currOj.value);
  }
  function toggleSolved(event: Event) {
    if (!event.target) return;
    const newValue = (event.target as HTMLInputElement).checked;
    ojContextStore.setSnapshotSolved(currOj.value, newValue);
  }
  watch(snapshot, (newSnapshot) => {
    isSolved.value = Boolean(newSnapshot?.solvedDate);
  });
</script>

<template>
  <ProblemsPageHeader />
  <div class="problems-page flex-1 grid">
    <Snapshot
      class="rounded-md m-1 mb-0"
      :curr-oj="currOj"
      :oj-context="ojContext"
      :snapshot="snapshot"
    />
    <Filters class="rounded-md m-1" :curr-oj="currOj" :oj-context="ojContext" />
  </div>

  <footer class="mt-auto w-full flex justify-around py-1.5">
    <button class="flex items-center btn-primary" @click="newProblem" :disabled="isBusy">
      {{ btnText }}
    </button>
    <div class="my-auto flex items-center">
      <label for="solved-checkbox" class="pr-2">Solved?</label>
      <input
        id="solved-checkbox"
        v-model="isSolved"
        type="checkbox"
        name="solved-checkbox"
        :disabled="!snapshot"
        @change="toggleSolved"
      />
    </div>
  </footer>
</template>

<style scoped>
  .problems-page {
    grid-template-rows: 1fr 1fr;
  }

  :deep(.filters) input[type='number'] {
    width: 130px;
  }

  :deep(.filters) input[type='number']:first-child {
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  :deep(.filters) input[type='number']:last-child {
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
</style>
