<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  import MainCard from './MainCard.vue';
  const props = defineProps<{
    page: Card[];
  }>();
</script>

<template>
  <div>
    <div v-for="card in page" :key="card.id">
      <MainCard :card="card" />
    </div>
  </div>
</template>
