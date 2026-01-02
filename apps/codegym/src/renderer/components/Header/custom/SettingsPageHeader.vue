<script lang="ts" setup>
  import Header from '../Header.vue';
  import HeaderButton from '../HeaderButton.vue';
</script>

<template>
  <Header class="flex justify-end">
    <HeaderButton to="/graph">Graph</HeaderButton>
    <HeaderButton to="/problems">Problems</HeaderButton>
    <HeaderButton to="/contests">Contests</HeaderButton>
    <HeaderButton to="/settings">Settings</HeaderButton>
  </Header>
</template>
