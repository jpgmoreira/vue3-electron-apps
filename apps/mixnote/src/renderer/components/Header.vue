<script lang="ts" setup>
  import Header from '@interapp/components/Header/Header.vue';
  import HeaderButton from '@interapp/components/Header/HeaderButton.vue';
</script>

<template>
  <Header class="flex justify-between">
    <div class="flex">
      <RouterLink class="nav-btn" :to="{ name: 'explorer', params: { view: 'notes' } }">
        Notes
      </RouterLink>
      <RouterLink class="nav-btn" :to="{ name: 'explorer', params: { view: 'flashcards' } }">
        Flashcards
      </RouterLink>
    </div>
    <div class="flex">
      <HeaderButton to="/graph">Graph</HeaderButton>
      <HeaderButton to="/settings">Settings</HeaderButton>
    </div>
  </Header>
</template>
