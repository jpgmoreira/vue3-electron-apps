<script lang="ts" setup>
  import MediaModal from './components/MediaModal.vue';
  import './style/index.css';
  import Toast from '@interapp/components/Toast.vue';
</script>

<template>
  <Toast />
  <MediaModal />
  <main class="flex flex-col min-h-screen">
    <RouterView />
  </main>
</template>
