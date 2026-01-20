<script lang="ts" setup>
  import { useRouter } from 'vue-router';
  const router = useRouter();
  function onClick() {
    router.back();
  }
</script>

<template>
  <button type="button" class="btn-primary" @click="onClick">Go back</button>
</template>
