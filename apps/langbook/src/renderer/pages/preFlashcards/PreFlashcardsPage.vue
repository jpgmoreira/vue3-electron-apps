<script lang="ts" setup>
  import { onMounted, ref, useTemplateRef, computed } from 'vue';
  import { useSettingsStore } from '@renderer/store/settings';
  import Header from '@renderer/components/Header.vue';
  import {
    DEFAULT_HIGH_FREQUENCY_INTERVAL,
    DEFAULT_LOW_FREQUENCY_INTERVAL,
  } from '@common/constants';
  import PreFlashcardsModals from './PreFlashcardsModals.vue';
  import { getEmptyStatistics, Statistics } from '@common/schemas/statistics';
  import { InvokeChannels } from '@preload/channels/invoke';

  const settingsStore = useSettingsStore();

  const statistics = ref(getEmptyStatistics());

  const lowInterval = ref(settingsStore.settings.lowInterval);
  const highInterval = ref(settingsStore.settings.highInterval);
  const modalsRef = useTemplateRef('modal');

  const emptyBucketTooltip = computed(() =>
    statistics.value.filteredBucket ? '' : 'There are no filtered cards in the bucket'
  );

  const clearHighTooltip = computed(() =>
    statistics.value.filteredHigh ? '' : 'There are no filtered cards with high frequency'
  );

  const clearLowTooltip = computed(() =>
    statistics.value.filteredLow ? '' : 'There are no filtered cards with low frequency'
  );

  function updateSettings() {
    settingsStore.updateSettings({
      lowInterval: lowInterval.value,
      highInterval: highInterval.value,
    });
  }

  function resetIntervals() {
    lowInterval.value = DEFAULT_LOW_FREQUENCY_INTERVAL;
    highInterval.value = DEFAULT_HIGH_FREQUENCY_INTERVAL;
    updateSettings();
  }

  function emptyBucket() {
    if (!modalsRef.value) throw new Error('Modal ref not set!');
    modalsRef.value.show('bucket', statistics.value.filteredBucket);
  }

  function clearHigh() {
    if (!modalsRef.value) throw new Error('Modal ref not set!');
    modalsRef.value.show('high', statistics.value.filteredHigh);
  }

  function clearLow() {
    if (!modalsRef.value) throw new Error('Modal ref not set!');
    modalsRef.value.show('low', statistics.value.filteredLow);
  }

  async function fetchStatistics() {
    const result = await window.api.invoke<Statistics>(InvokeChannels.getStatistics);
    statistics.value = result;
  }

  onMounted(() => {
    fetchStatistics();
  });
</script>

<template>
  <div class="settings-page">
    <PreFlashcardsModals ref="modal" @cleared="fetchStatistics" />
    <Header />
    <div class="content">
      <h1>Flashcards study</h1>

      <section>
        <h2>Overall statistics</h2>
        <div>
          <span>Total number of cards</span>
          <b>{{ statistics.totalCards }}</b>
        </div>
        <div>
          <span>Total number of cards in the review bucket</span>
          <b>{{ statistics.totalBucket }}</b>
        </div>
        <div>
          <span>Total number of low frequency cards</span>
          <b>{{ statistics.totalLow }}</b>
        </div>
        <div>
          <span>Total number of high frequency cards</span>
          <b>{{ statistics.totalHigh }}</b>
        </div>
        <div>
          <span>Total number of normal frequency cards</span>
          <b>{{ statistics.totalNormal }}</b>
        </div>
      </section>

      <section>
        <h2>Selected cards</h2>
        <div>
          <span>Selected cards</span>
          <b>{{ statistics.filtered }}</b>
        </div>
        <div>
          <span>Selected cards in the review bucket</span>
          <b>{{ statistics.filteredBucket }}</b>
        </div>
        <div>
          <span>Selected cards with low frequency</span>
          <b>{{ statistics.filteredLow }}</b>
        </div>
        <div>
          <span>Selected cards with high frequency</span>
          <b>{{ statistics.filteredHigh }}</b>
        </div>
        <div>
          <span>Selected cards with normal frequency</span>
          <b>{{ statistics.filteredNormal }}</b>
        </div>
      </section>

      <section>
        <h2>Intervals</h2>
        <div>
          <span>High frequency interval</span>
          <input type="number" v-model="highInterval" @change="updateSettings" />
        </div>
        <div>
          <span>Low frequency interval</span>
          <input type="number" v-model="lowInterval" @change="updateSettings" />
        </div>
        <div class="flex">
          <button type="button" class="ml-auto btn-primary" @click="resetIntervals">Reset</button>
        </div>
      </section>

      <section>
        <h2>Filters</h2>
        <div>
          <span>Empty review bucket for selected cards</span>
          <button
            type="button"
            class="btn-warning"
            @click="emptyBucket"
            :disabled="!statistics.filteredBucket"
            v-tooltip="emptyBucketTooltip"
          >
            Empty
          </button>
        </div>
        <div>
          <span>Clear high-frequency selected cards</span>
          <button
            type="button"
            class="btn-warning"
            @click="clearHigh"
            :disabled="!statistics.filteredHigh"
            v-tooltip="clearHighTooltip"
          >
            Clear
          </button>
        </div>
        <div>
          <span>Clear low-frequency selected cards</span>
          <button
            type="button"
            class="btn-warning"
            @click="clearLow"
            :disabled="!statistics.filteredLow"
            v-tooltip="clearLowTooltip"
          >
            Clear
          </button>
        </div>
      </section>

      <div>
        <button type="button" class="btn btn-primary">Start</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  input {
    max-width: 80px;
    text-align: center;
  }
</style>
