<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['timus'].filters);
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Difficulty:</label>
      <div>
        <input
          v-model="filters.difficulty.min"
          type="number"
          placeholder="min"
          @change="onChange"
        />
        <input
          v-model="filters.difficulty.max"
          type="number"
          placeholder="max"
          @change="onChange"
        />
      </div>
    </div>
    <div class="flex items-center mt-2">
      <div class="flex items-center pr-1.5">
        <label>Popularity</label>
        <span class="popularity-info-icon mx-0.5 cursor-help relative">
          <span class="tooltip absolute left-full top-0">
            All problems sorted from most solved to least solved, divided in groups of 20.
          </span>
        </span>
        <span>:</span>
      </div>
      <div>
        <input
          v-model="filters.popularity.min"
          type="number"
          placeholder="min"
          @change="onChange"
        />
        <input
          v-model="filters.popularity.max"
          type="number"
          placeholder="max"
          @change="onChange"
        />
      </div>
    </div>
  </div>
</template>
