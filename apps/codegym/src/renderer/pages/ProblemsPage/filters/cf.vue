<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { useProfileStore } from '@renderer/store/profile';
  import Multiselect, { MultiselectOption } from '@renderer/components/UI/Multiselect.vue';
  const ojMetaStore = useOjMetaStore();
  const profileStore = useProfileStore();
  const ojContext = computed(() => profileStore.currProfile!.ojContext);
  const filters = computed(() => ojContext.value['cf'].filters);
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
  const selectedTags = computed(() => ojContext.value['cf'].filters.tags.values);
  function onChange() {
    profileStore.updateOjFilters();
  }
  function handleSelectTag(value: string) {
    ojContext.value['cf'].filters.tags.values.push(value);
    profileStore.updateOjFilters();
  }
  function handleDeselectTag(value: string) {
    const currTags = ojContext.value['cf'].filters.tags.values;
    ojContext.value['cf'].filters.tags.values = currTags.filter((tag) => tag !== value);
    profileStore.updateOjFilters();
  }
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Rating:</label>
      <div>
        <input v-model="filters.rating.min" type="number" placeholder="min" @change="onChange" />
        <input v-model="filters.rating.max" type="number" placeholder="max" @change="onChange" />
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
    <Multiselect
      class="mt-2"
      :options="tagsOptions"
      :selected="selectedTags"
      :badge-numbers="true"
      :option-numbers="true"
      close
      placeholder="Tags"
      direction="up"
      @select-option="handleSelectTag"
      @deselect-option="handleDeselectTag"
    />
  </div>
</template>
