<script lang="ts" setup>
  import ProblemsPageHeader from '@renderer/components/Header/custom/ProblemsPageHeader.vue';
  import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
  import { OjProblem } from '@common/schemas/problems';
  import { Channels } from '@common/types/channels';
  import { Oj } from '@common/types/oj';
  import { useProfileStore } from '@renderer/store/profile';
  import { handleProblemClick } from '@renderer/utils/utils';
  import { useRouter } from 'vue-router';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { ref, onMounted, computed, watch, useTemplateRef } from 'vue';

  const router = useRouter();
  const profileStore = useProfileStore();
  const problems = ref<OjProblem[Oj][]>([]);
  const loaded = ref(false);

  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nTotalRows = ref(0);
  const anchor = ref(0);
  const tableOffset = ref(0); // This is important. If we use a computed property, a lot of bugs happen.

  const paddingBottom = 200;
  const rowHeight = 40;

  const scrollContainer = useTemplateRef('scroll-container');

  const currOj = computed(() => profileStore.currProfile!.currOj);

  const ghostStyle = computed(() => ({
    height: `${nTotalRows.value * rowHeight + paddingBottom}px`,
  }));

  async function fetchHistory(newAnchor: number) {
    const result = await window.api.invoke<FetchHistoryPageResponseDTO<typeof currOj.value>>(
      Channels.fetchHistoryPage,
      currOj.value,
      newAnchor
    );
    problems.value = result.data;
    nTotalRows.value = result.total;
    anchor.value = newAnchor;
    tableOffset.value = newAnchor * rowHeight;
  }

  function handleClick(problem: OjProblem[Oj]) {
    handleProblemClick(problem);
    profileStore.setCurrOjSnapshot(problem);
    router.replace('/problems');
  }

  function handleScroll() {
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(() => {
      const container = scrollContainer.value;
      if (!container) return;
      const scrollTop = container.scrollTop;
      const newAnchor = Math.max(0, Math.floor(scrollTop / rowHeight) - 30);
      fetchHistory(newAnchor);
    }, 40);
  }

  onMounted(async () => {
    await fetchHistory(0);
    loaded.value = true;
  });

  watch(
    currOj,
    () => {
      fetchHistory(0);
    },
    { immediate: true }
  );
</script>

<template>
  <div class="flex flex-col h-[100vh]">
    <ProblemsPageHeader />
    <div
      v-if="loaded"
      ref="scroll-container"
      class="grow relative overflow-y-auto"
      @scroll="handleScroll"
    >
      <div v-if="!problems.length" class="absolute-center text-xl opacity-70">
        No history for this Online Judge
      </div>
      <div v-else class="relative">
        <table class="header-table sticky top-0 w-full table-fixed">
          <thead>
            <tr>
              <th class="first-col">#</th>
              <th>Problem</th>
              <th class="last-col">Date</th>
            </tr>
          </thead>
        </table>
        <div class="ghost" :style="ghostStyle"></div>
        <table
          class="problems-table w-full absolute left-0 table-fixed"
          :style="{ transform: `translateY(${tableOffset}px)` }"
        >
          <tbody>
            <tr v-for="(problem, index) in problems" :key="problem.id">
              <td class="first-col">{{ index + anchor + 1 }}</td>
              <td class="overflow-hidden">
                <a href="#" @click="handleClick(problem)">
                  {{ problem.name || '\<no name available\>' }}
                </a>
                <span
                  v-if="problem.solvedDate !== null"
                  class="alert success inline-flex text-xs font-bold ml-2 px-1 py-0.5 rounded-md select-none"
                >
                  Solved
                </span>
              </td>
              <td class="last-col">{{ parseTimestamp(problem.timestamp!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
  tr {
    white-space: nowrap;
    height: 40px;
  }
  .ghost {
    z-index: 1;
  }
  .header-table {
    height: 40px;
    z-index: 3;
  }
  .problems-table {
    z-index: 2;
    top: 41px;
    will-change: transform;
  }
  .first-col {
    width: 90px;
    padding-left: 35px;
  }
  .last-col {
    width: 220px;
  }
</style>
