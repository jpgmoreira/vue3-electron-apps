<script lang="ts" setup>
  import Header from '@interapp/components/Header/Header.vue';
  import HeaderButton from '@interapp/components/Header/HeaderButton.vue';
</script>

<template>
  <Header class="flex justify-between">
    <div class="flex">
      <HeaderButton to="/cards">Cards</HeaderButton>
      <HeaderButton to="/flashcards">Flashcards</HeaderButton>
    </div>
    <div class="flex">
      <HeaderButton to="/graph">Graph</HeaderButton>
      <HeaderButton to="/settings">Settings</HeaderButton>
    </div>
  </Header>
</template>
