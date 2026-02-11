<script lang="ts" setup>
  import { reactive, useTemplateRef, watch, nextTick } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import LineChart, { type LineChartProps } from '@interapp/components/LineChart.vue';
  import { useGraphStore } from '@renderer/store/graph';
  import { randomId } from '@interapp/utils/utils';
  import { getTodayDate, incrementDate, parseNumericDate } from '@interapp/utils/dateUtils';
  import { storeToRefs } from 'pinia';
  const store = useGraphStore();
  const { graph } = storeToRefs(store);
  const chartRef = useTemplateRef('chart-ref');
  const content = reactive<LineChartProps>({
    allXValues: [],
    allXLabels: [],
    data: [],
    yLinesMode: 'data-only',
  });
  function updateData() {
    const series: LineChartProps['data'][number] = {
      id: randomId(),
      color: '#3B82F6',
      title: 'Minutes studied',
      x: [],
      y: [],
    };
    content.allXValues = [];
    content.allXLabels = [];
    content.data = [];
    const today = getTodayDate();
    const minDate = graph.value.length ? graph.value[0].date : today;
    let r = 0;
    for (let d = minDate, i = 0; d <= today; d = incrementDate(d), i++) {
      series.x.push(i);
      content.allXValues.push(i);
      content.allXLabels.push(parseNumericDate(d));
      if (r < graph.value.length && graph.value[r].date === d) {
        const record = graph.value[r];
        series.y.push(record.minutes);
        r++;
      } else {
        series.y.push(0);
      }
    }
    content.data.push(series);
    nextTick(() => {
      chartRef.value?.flush();
    });
  }
  watch(
    graph,
    () => {
      updateData();
    },
    { deep: true, immediate: true }
  );
</script>

<template>
  <div class="w-screen h-screen flex flex-col">
    <Header />
    <LineChart v-bind="content" ref="chart-ref" />
  </div>
</template>
