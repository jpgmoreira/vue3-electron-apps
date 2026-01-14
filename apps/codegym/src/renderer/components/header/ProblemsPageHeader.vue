<script lang="ts" setup>
  import Header from '@interapp/components/Header/Header.vue';
  import HeaderButton from '@interapp/components/Header/HeaderButton.vue';
</script>

<template>
  <Header class="flex justify-between">
    <div class="flex">
      <select></select>
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
