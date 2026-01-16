<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { useOjContextStore } from '@renderer/store/ojContext';
  import Multiselect, { MultiselectOption } from '@interapp/components/Multiselect.vue';
  const ojMetaStore = useOjMetaStore();
  const ojContextStore = useOjContextStore();
  const filters = computed(() => ojContextStore.context['cf'].filters);
  const tagsOptions = computed<MultiselectOption[]>(() => {
    const result: MultiselectOption[] = [];
    ojMetaStore.ojMeta['cf']?.tags.forEach((tag) => {
      result.push({
        text: tag,
        value: tag,
      });
    });
    return result;
  });
  const selectedTags = computed(() => filters.value.tags.values);
  function onInput() {
    ojContextStore.flushOjContext('cf');
  }
  function handleSelectTag(value: string) {
    filters.value.tags.values.push(value);
    ojContextStore.flushOjContext('cf');
  }
  function handleDeselectTag(value: string) {
    const currTags = filters.value.tags.values;
    filters.value.tags.values = currTags.filter((tag) => tag !== value);
    ojContextStore.flushOjContext('cf');
  }
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Rating:</label>
      <div>
        <input v-model="filters.rating.min" type="number" placeholder="min" @input="onInput" />
        <input v-model="filters.rating.max" type="number" placeholder="max" @input="onInput" />
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
    <Multiselect
      class="mt-2"
      :options="tagsOptions"
      :selected="selectedTags"
      option-numbers
      close
      placeholder="Tags"
      direction="up"
      @select-option="handleSelectTag"
      @deselect-option="handleDeselectTag"
    />
  </div>
</template>
