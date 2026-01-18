<script lang="ts" setup>
  import './style/index.css';
  import Toast from '@interapp/components/Toast.vue';
</script>

<template>
  <Toast />
  <main class="flex flex-col min-h-screen">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </main>
</template>
