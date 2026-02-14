<script lang="ts" setup>
  import { ref, computed, onMounted, useTemplateRef } from 'vue';
  import { useStatisticsStore } from '@renderer/store/statistics';
  import { useSettingsStore } from '@renderer/store/settings';
  import {
    DEFAULT_HIGH_FREQUENCY_INTERVAL,
    DEFAULT_LOW_FREQUENCY_INTERVAL,
  } from '@common/constants';
  import SelectionList from '@interapp/components/SelectionList.vue';
  import { FREQUENCY_OPTIONS, YES_OR_NO_OPTIONS } from '@renderer/helpers/options';
  import { useFiltersStore } from '@renderer/store/filters';
  import { YesOrNo } from '@interapp/types/yesOrNo';
  import { NoteFrequency } from '@common/schemas/notes';
  import PreFlashcardsModals from './PreFlashcardsModals.vue';
  import { useNotesStore } from '@renderer/store/notes';
  import { useTabsStore } from '@renderer/store/tabs';

  const statisticsStore = useStatisticsStore();
  const settingsStore = useSettingsStore();
  const filtersStore = useFiltersStore();
  const notesStore = useNotesStore();
  const tabsStore = useTabsStore();

  const statistics = computed(() => statisticsStore.statistics);
  const bucketFilter = computed(() => filtersStore.filters.bucket);
  const frequencyFilter = computed(() => filtersStore.filters.frequencies);

  const lowInterval = ref(settingsStore.settings.lowInterval);
  const highInterval = ref(settingsStore.settings.highInterval);
  const modalsRef = useTemplateRef('modal');

  const emptyBucketTooltip = computed(() =>
    statistics.value.filteredBucket ? '' : 'There are no filtered notes in the bucket'
  );

  const clearHighTooltip = computed(() =>
    statistics.value.filteredHigh ? '' : 'There are no filtered notes with high frequency'
  );

  const clearLowTooltip = computed(() =>
    statistics.value.filteredLow ? '' : 'There are no filtered notes with low frequency'
  );

  function fetchStatistics() {
    statisticsStore.refetch();
  }

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

  async function toggleBucket(value: YesOrNo) {
    await filtersStore.toggleBucket(value);
    fetchStatistics();
  }

  async function toggleFrequency(value: NoteFrequency) {
    await filtersStore.toggleFrequency(value);
    fetchStatistics();
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

  function cleared() {
    fetchStatistics();
    const noteIds = tabsStore.tabGroups.map((g) => g.tabs.map((t) => t.noteId)).flat();
    notesStore.refetchCache(noteIds);
  }

  onMounted(() => {
    fetchStatistics();
  });
</script>

<template>
  <div class="settings-page absolute inset-0 overflow-auto">
    <PreFlashcardsModals ref="modal" @cleared="cleared" />
    <div class="content">
      <div class="flex justify-between">
        <h1>Flashcards study</h1>
        <button type="button" class="btn btn-primary">Start</button>
      </div>

      <section>
        <h2>Filters</h2>
        <div>
          <span>Review bucket</span>
          <SelectionList
            :options="[...YES_OR_NO_OPTIONS]"
            :selected="bucketFilter"
            @toggle="toggleBucket"
          />
        </div>
        <div>
          <span>Frequency</span>
          <SelectionList
            :options="[...FREQUENCY_OPTIONS]"
            :selected="frequencyFilter"
            @toggle="toggleFrequency"
          />
        </div>
      </section>

      <section>
        <h2>Selected notes</h2>
        <div>
          <span>Selected notes</span>
          <b>{{ statistics.filtered }}</b>
        </div>
        <div>
          <span>Selected notes in the review bucket</span>
          <b>{{ statistics.filteredBucket }}</b>
        </div>
        <div>
          <span>Selected notes with low frequency</span>
          <b>{{ statistics.filteredLow }}</b>
        </div>
        <div>
          <span>Selected notes with high frequency</span>
          <b>{{ statistics.filteredHigh }}</b>
        </div>
        <div>
          <span>Selected notes with normal frequency</span>
          <b>{{ statistics.filteredNormal }}</b>
        </div>
      </section>

      <section>
        <h2>Overall statistics</h2>
        <div>
          <span>Total number of notes</span>
          <b>{{ statistics.total }}</b>
        </div>
        <div>
          <span>Total number of notes in the review bucket</span>
          <b>{{ statistics.totalBucket }}</b>
        </div>
        <div>
          <span>Total number of low frequency notes</span>
          <b>{{ statistics.totalLow }}</b>
        </div>
        <div>
          <span>Total number of high frequency notes</span>
          <b>{{ statistics.totalHigh }}</b>
        </div>
        <div>
          <span>Total number of normal frequency notes</span>
          <b>{{ statistics.totalNormal }}</b>
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
        <h2>Clear</h2>
        <div>
          <span>Empty review bucket for selected notes</span>
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
          <span>Clear high-frequency selected notes</span>
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
          <span>Clear low-frequency selected notes</span>
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
    </div>
  </div>
</template>

<style scoped>
  input {
    max-width: 80px;
    text-align: center;
  }
</style>
