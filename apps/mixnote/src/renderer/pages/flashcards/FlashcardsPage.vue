<script lang="ts" setup>
  import { useRouter } from 'vue-router';
  const router = useRouter();
  function exit() {
    router.back();
  }
</script>

<template>
  <div class="flashcards-page flex flex-col h-screen select-none">
    <div class="grow relative"></div>
    <footer class="custom-footer flex justify-evenly">
      <button type="button" class="btn-primary">Prev</button>
      <button type="button" class="btn-primary">Next</button>
      <button type="button" class="btn-primary">Edit</button>
      <button type="button" class="btn-warning" @click="exit">Exit</button>
    </footer>
  </div>
</template>
