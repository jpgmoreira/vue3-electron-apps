<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['uva'].filters);
</script>

<template>
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
    <div class="flex items-center mt-2">
      <label class="pr-1.5" for="starred">Starred:</label>
      <input
        id="starred"
        v-model="filters.starred.value"
        type="checkbox"
        name="starred"
        @change="onChange"
      />
    </div>
  </div>
</template>
