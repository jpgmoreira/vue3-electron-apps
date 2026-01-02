<script lang="ts" setup>
  import { useUIStore } from '@renderer/store/ui';
  const store = useUIStore();
</script>
<template>
  <Transition name="toast-transition">
    <div v-if="store.toast.visible" class="toast-container" :class="store.toast.type">
      {{ store.toast.message }}
    </div>
  </Transition>
</template>

<style scoped>
  .toast-container {
    position: fixed;
    top: 6px;
    right: 6px;
    padding: 12px;
    border-radius: 5px;
    z-index: 99999;
  }
  .toast-transition-enter-active {
    animation: toast-animation 0.7s;
  }
  .toast-transition-leave-active {
    animation: toast-animation 0.7s reverse;
  }
  @keyframes toast-animation {
    0% {
      opacity: 0;
      transform: rotate(-8deg);
      top: -70px;
    }
    50% {
      transform: rotate(-5deg);
      top: 15px;
    }
    70% {
      transform: rotate(0deg);
      top: 6px;
    }
    90% {
      transform: rotate(1deg);
      top: 7px;
    }
    100% {
      opacity: 1;
      transform: rotate(0deg);
      top: 6px;
    }
  }
</style>
