<script setup lang="ts" generic="T extends number | string">
  type Props = {
    options: {
      text: string;
      value: T;
    }[];
    selected?: T[];
  };
  const props = defineProps<Props>();
  const emit = defineEmits<{ (e: 'toggle', value: T): void }>();
  function toggle(value: T) {
    emit('toggle', value);
  }
  function valueClass(value: T) {
    if (props.selected?.includes(value)) return 'selected';
    return '';
  }
</script>

<template>
  <div class="selection-list">
    <div
      v-for="op in options"
      @click="toggle(op.value)"
      :class="valueClass(op.value)"
      :key="op.value"
    >
      {{ op.text }}
    </div>
  </div>
</template>
