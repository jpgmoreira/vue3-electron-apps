<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import ProblemsPageHeader from '@renderer/components/Header/custom/ProblemsPageHeader.vue';
  import BusyButton from '@renderer/components/UI/BusyButton.vue';
  import Filters from './Filters.vue';
  import Snapshot from './Snapshot.vue';
  const profileStore = useProfileStore();
  const ojStatusStore = useOjStatusStore();
  const currOj = computed(() => profileStore.currProfile!.currOj);
  const ojContext = computed(() => profileStore.currProfile!.ojContext);
  const snapshot = computed(() => ojContext.value[currOj.value].snapshot);
  const isRequestingProblem = computed(() => ojStatusStore[currOj.value].isRequestingProblem);
  const isUpdatingCache = computed(() => ojStatusStore[currOj.value].isUpdatingCache);
  const isBusy = computed(() => isRequestingProblem.value || isUpdatingCache.value);
  const btnText = computed(() => (isUpdatingCache.value ? 'Updating cache' : 'New problem'));
  const isSolved = ref(Boolean(snapshot.value?.solvedDate));
  async function handleNewProblemClick() {
    profileStore.requestNewProblem();
  }
  function handleSolvedChange(event: Event) {
    if (!event.target) return;
    profileStore.setCurrSnapshotSolved((event.target as HTMLInputElement).checked);
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
    <BusyButton
      class="flex items-center btn-primary"
      :callback="handleNewProblemClick"
      :busy="isBusy"
    >
      <template #default>New problem</template>
      <template #busy>{{ btnText }}</template>
    </BusyButton>
    <div class="my-auto flex items-center">
      <label for="solved-checkbox" class="pr-2">Solved?</label>
      <input
        id="solved-checkbox"
        v-model="isSolved"
        type="checkbox"
        name="solved-checkbox"
        :disabled="!snapshot"
        @change="handleSolvedChange"
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
    margin-right: 1px;
  }

  :deep(.filters) input[type='number']:last-child {
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }

  :deep(.tag-badge) {
    font-size: 0.92rem;
    border-radius: 5px;
    padding: 2px 4px;
  }
</style>
