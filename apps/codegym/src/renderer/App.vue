<script lang="ts" setup>
  import './style/index.css';
  import Toast from '@interapp/components/Toast/Toast.vue';
</script>

<template>
  <Toast />
  <main class="flex flex-col min-h-full">
    <RouterView />
  </main>
</template>
