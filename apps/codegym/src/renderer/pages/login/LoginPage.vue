<script lang="ts" setup>
  import { computed, ref, useTemplateRef } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { ProfileRecord } from '@common/schemas/profile';
  import LoginModals, { type ModalType } from './LoginModals.vue';
  const profileStore = useProfileStore();
  const selected = ref<ProfileRecord | null>(null);
  const modals = useTemplateRef('modals');
  const records = computed(() => profileStore.registry.profileRecords);
  function selectRow(record: ProfileRecord) {
    selected.value = record;
  }
  function open(which: ModalType) {
    if (!modals.value) throw new Error('Invalid modals!');
    modals.value.show(which, selected.value);
  }
</script>

<template>
  <div class="login-page flex flex-col h-screen overflow-hidden">
    <LoginModals ref="modals" />
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
            <tr
              v-for="record in records"
              class="cursor-pointer"
              @click="selectRow(record)"
              :class="{ selected: selected === record }"
            >
              <td>{{ record.name }}</td>
              <td>{{ parseTimestamp(record.createdAt) }}</td>
              <td>{{ parseTimestamp(record.lastAccess) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <footer class="flex justify-center gap-1.5 p-2">
      <button type="button" class="btn-primary" @click="open('create')">Create</button>
      <button type="button" class="btn-primary" :disabled="!selected">Select</button>
      <button type="button" class="btn-primary" @click="open('rename')" :disabled="!selected">
        Rename
      </button>
      <button type="button" class="btn-primary" @click="open('delete')" :disabled="!selected">
        Delete
      </button>
    </footer>
  </div>
</template>
