<script lang="ts" setup>
  import { ref, onBeforeMount } from 'vue';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import LineChart, { LineChartProps } from '@interapp/components/LineChart.vue';
  import { OjList, OjNames, OjColors } from '@common/schemas/oj';
  import { parseNumericDate, incrementDate, getTodayDate } from '@interapp/utils/dateUtils';
  import { randomId } from '@interapp/utils/utils';
  import { useGraphStore } from '@renderer/store/graph';
  const content = ref<LineChartProps>({
    allXValues: [],
    allXLabels: [],
    data: [],
    yLinesMode: 'all',
  });
  const store = useGraphStore();
  const hasContent = ref(false);
  const graph = store.graphData;
  function setContent() {
    if (!graph.length) return;
    const firstDate = graph[0].date;
    const lastDate = getTodayDate();
    const names = { ...OjNames, contests: 'Contests', total: 'Total' } as const;
    const list = [...OjList, 'contests', 'total'] as const;
    const ojToSeries = list.reduce(
      (acc, val) => {
        acc[val] = {
          id: randomId(),
          title: names[val],
          color: OjColors[val],
          x: [],
          y: [],
        };
        return acc;
      },
      {} as Record<string, LineChartProps['data'][number]>
    );
    for (let date = firstDate, i = 0, j = 0; date <= lastDate; date = incrementDate(date), i++) {
      content.value.allXValues.push(i);
      content.value.allXLabels.push(parseNumericDate(date));
      const record = j < graph.length ? graph[j] : null;
      if (record && record.date === date) {
        let total = 0;
        for (const oj of list) {
          if (oj === 'total') continue;
          ojToSeries[oj].x.push(i);
          ojToSeries[oj].y.push(record[oj]);
          total += record[oj];
        }
        ojToSeries['total'].x.push(i);
        ojToSeries['total'].y.push(total);
        j++;
      } else {
        for (const oj of list) {
          ojToSeries[oj].x.push(i);
          ojToSeries[oj].y.push(0);
        }
      }
    }
    content.value.data = Object.values(ojToSeries);
  }
  onBeforeMount(() => {
    if (graph.length) {
      setContent();
      hasContent.value = true;
    }
  });
</script>

<template>
  <div class="w-full h-screen flex flex-col">
    <SettingsPageHeader />
    <LineChart v-if="hasContent" v-bind="content" />
    <div v-else class="flex grow items-center justify-center text-xl opacity-70">
      No problems solved yet!
    </div>
  </div>
</template>
