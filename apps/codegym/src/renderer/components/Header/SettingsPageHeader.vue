<script lang="ts" setup>
  import Header from '@interapp/components/Header/Header.vue';
  import HeaderButton from '@interapp/components/Header/HeaderButton.vue';
</script>

<template>
  <Header class="flex justify-end">
    <HeaderButton to="/problems">Problems</HeaderButton>
    <HeaderButton to="/graph">Graph</HeaderButton>
    <HeaderButton to="/contests">Contests</HeaderButton>
    <HeaderButton to="/settings">Settings</HeaderButton>
  </Header>
</template>
