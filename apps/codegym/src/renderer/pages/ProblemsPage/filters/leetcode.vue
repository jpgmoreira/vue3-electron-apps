<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['leetcode'].filters);
</script>

<template>
  <div>
    <div>
      <div class="flex items-center">
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
    <div class="flex items-center mt-2">
      <label class="pr-1.5">Premium:</label>
      <select v-model="filters.premium.value" @change="onChange">
        <option value="both">Both</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
    <div class="flex items-center mt-2">
      <span class="pr-1.5">Difficulty:</span>
      <input
        id="easy"
        v-model="filters.difficulty.values"
        type="checkbox"
        name="easy"
        value="easy"
        @change="onChange"
      />
      <label class="mr-2 ml-0.5" for="easy">Easy</label>
      <input
        id="medium"
        v-model="filters.difficulty.values"
        type="checkbox"
        name="medium"
        value="medium"
        @change="onChange"
      />
      <label class="mr-2 ml-0.5" for="medium">Medium</label>
      <input
        id="hard"
        v-model="filters.difficulty.values"
        type="checkbox"
        name="hard"
        value="hard"
        @change="onChange"
      />
      <label class="ml-0.5" for="hard">Hard</label>
    </div>
  </div>
</template>
