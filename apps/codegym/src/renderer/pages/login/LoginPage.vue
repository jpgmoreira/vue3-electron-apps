<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const profileStore = useProfileStore();
  const records = computed(() => profileStore.registry.profileRecords);
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="text-center">Select or create a profile</div>
    <div class="grow relative">
      <div v-if="!records.length" class="absolute-center message-xl">No profile yet!</div>
    </div>
    <footer class="flex justify-center">
      <button type="button" class="btn-primary">Create</button>
      <button type="button" class="btn-primary">Select</button>
      <button type="button" class="btn-primary">Rename</button>
      <button type="button" class="btn-primary">Delete</button>
    </footer>
  </div>
</template>
