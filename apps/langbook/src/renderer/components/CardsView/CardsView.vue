<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  const props = defineProps<{
    page: Card[];
  }>();
</script>

<template>
  <div>
    <div v-for="card in page" :key="card.id">
      <div>{{ card.front }}</div>
    </div>
  </div>
</template>
