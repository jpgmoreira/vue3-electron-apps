<script lang="ts" setup>
  import { ref } from 'vue';
  import Header from '../Header.vue';
  import HeaderButton from '../HeaderButton.vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { OjNames } from '@common/types/oj';
  const store = useProfileStore();
  const currOj = ref(store.currProfile!.currOj);
</script>

<template>
  <Header class="flex justify-between">
    <div class="flex">
      <select v-model="currOj" @change="store.updateCurrOj(currOj)">
        <option v-for="(value, key) in OjNames" :key="key" :value="key">{{ value }}</option>
      </select>
      <HeaderButton to="/history">History</HeaderButton>
    </div>
    <div class="flex">
      <HeaderButton to="/graph">Graph</HeaderButton>
      <HeaderButton to="/problems">Problems</HeaderButton>
      <HeaderButton to="/contests">Contests</HeaderButton>
      <HeaderButton to="/settings">Settings</HeaderButton>
    </div>
  </Header>
</template>

<style lang="css" scoped>
  select {
    border-radius: 0;
  }
  select:focus {
    outline: none;
  }
</style>
