<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjContextStore } from '@renderer/store/ojContext';
  import { POPULARITY_GROUP_SIZE } from '@common/constants';
  const store = useOjContextStore();
  function onChange() {
    store.flushOjContext('uva');
  }
  const filters = computed(() => store.context['uva'].filters);
</script>

<template>
  <div>
    <div class="flex items-center">
      <div class="flex items-center pr-1.5">
        <label>Popularity</label>
        <span
          class="popularity-info-icon mx-0.5 cursor-help"
          v-tooltip="
            `All problems sorted from most solved to least solved, divided in groups of ${POPULARITY_GROUP_SIZE}.`
          "
        >
          &#9432;
        </span>
        <span>:</span>
      </div>
      <div>
        <input v-model="filters.popularity.min" type="number" placeholder="min" @input="onChange" />
        <input v-model="filters.popularity.max" type="number" placeholder="max" @input="onChange" />
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
