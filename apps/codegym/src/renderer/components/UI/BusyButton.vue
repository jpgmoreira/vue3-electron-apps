<script lang="ts" setup>
  /**
   * BusyButton
   *
   * Displays a "busy" state with debounce on entry to prevent flickering during short tasks.
   * The busy state is controlled externally via the "busy" prop.
   */
  import { ref, watch, onBeforeUnmount } from 'vue';
  const props = defineProps<{
    busy: boolean;
    callback: () => void;
    debounce?: number;
    disabled?: boolean;
  }>();
  const debounceTime = props.debounce || 200;
  const isBusy = ref(props.busy);
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;
  function handleClick() {
    if (isBusy.value || props.disabled) return;
    props.callback();
  }
  watch(
    () => props.busy,
    (busyNow) => {
      clearTimeout(timer);
      if (busyNow) {
        timer = setTimeout(() => (isBusy.value = true), debounceTime);
      } else {
        isBusy.value = false;
      }
    },
    { immediate: true }
  );
  onBeforeUnmount(() => {
    clearTimeout(timer);
  });
</script>

<template>
  <button
    type="button"
    class="flex items-center btn-primary"
    :disabled="isBusy || props.disabled"
    @click="handleClick"
  >
    <template v-if="!isBusy">
      <slot name="default"></slot>
    </template>
    <template v-else>
      <slot name="busy"></slot>
      <span v-if="isBusy" class="loader ml-1"></span>
    </template>
  </button>
</template>
