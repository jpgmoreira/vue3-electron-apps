<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  const profileStore = useProfileStore();
  const records = computed(() => profileStore.registry.profileRecords);
</script>

<template>
  <div class="login-page flex flex-col h-screen overflow-hidden">
    <div class="text-center p-2">Select or create a profile</div>
    <div class="grow relative records-container overflow-y-auto">
      <div v-if="!records.length" class="absolute-center message-xl">No profile yet!</div>
      <div v-else>
        <table>
          <thead class="sticky top-0">
            <tr>
              <th>Profile</th>
              <th>Created at</th>
              <th>Last access</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="profile in records" class="cursor-pointer">
              <td>{{ profile.name }}</td>
              <td>{{ parseTimestamp(profile.createdAt) }}</td>
              <td>{{ parseTimestamp(profile.lastAccess) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <footer class="flex justify-center gap-1.5 p-2">
      <button type="button" class="btn-primary">Create</button>
      <button type="button" class="btn-primary">Select</button>
      <button type="button" class="btn-primary">Rename</button>
      <button type="button" class="btn-primary">Delete</button>
    </footer>
  </div>
</template>
