<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjContextStore } from '@renderer/store/ojContext';
  const store = useOjContextStore();
  function onInput() {
    store.flushOjContext('neps');
  }
  const filters = computed(() => store.context['neps'].filters);
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Score:</label>
      <div>
        <input v-model="filters.score.min" type="number" placeholder="min" @input="onInput" />
        <input v-model="filters.score.max" type="number" placeholder="max" @input="onInput" />
      </div>
    </div>
    <div class="flex items-center mt-2">
      <div class="flex items-center pr-1.5">
        <label>Popularity</label>
        <span
          class="popularity-info-icon mx-0.5 cursor-help"
          v-tooltip="
            'All problems sorted from most solved to least solved, divided in groups of 20.'
          "
        >
          &#9432;
        </span>
        <span>:</span>
      </div>
      <div>
        <input v-model="filters.popularity.min" type="number" placeholder="min" @input="onInput" />
        <input v-model="filters.popularity.max" type="number" placeholder="max" @input="onInput" />
      </div>
    </div>
  </div>
</template>
