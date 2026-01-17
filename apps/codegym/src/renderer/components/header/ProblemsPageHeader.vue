<script lang="ts" setup>
  import { ref } from 'vue';
  import { useUIStore } from '@renderer/store/ui';
  import Header from '@interapp/components/Header/Header.vue';
  import HeaderButton from '@interapp/components/Header/HeaderButton.vue';
  import { OjNames } from '@common/schemas/oj';
  const store = useUIStore();
  const currOj = ref(store.settings.currOj);
</script>

<template>
  <Header class="flex justify-between">
    <div class="flex">
      <select v-model="currOj" @change="store.updateSettings({ currOj })">
        <option v-for="(value, key) in OjNames" :key="key" :value="key">{{ value }}</option>
      </select>
      <HeaderButton to="/history">History</HeaderButton>
    </div>
    <div class="flex">
      <HeaderButton to="/problems">Problems</HeaderButton>
      <HeaderButton to="/graph">Graph</HeaderButton>
      <HeaderButton to="/contests">Contests</HeaderButton>
      <HeaderButton to="/settings">Settings</HeaderButton>
    </div>
  </Header>
</template>

<style scoped>
  select {
    border-radius: 0 !important;
  }
</style>
