<script setup lang="ts">
  import { ref, reactive, computed, useTemplateRef, watch, provide } from 'vue';
  import { ProfileRecord } from '@common/schemas/profile';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { LoginActionsKey } from './loginActions';
  import { useUIStore } from '@renderer/store/ui';
  import { useRouter } from 'vue-router';
  import { useProfileStore } from '@renderer/store/profile';
  import { APP_NAME } from '@common/constants';
  import LoginPageModals from './BaseLoginModals.vue';

  const profileStore = useProfileStore();
  const uiStore = useUIStore();

  const router = useRouter();

  const modalsRef = useTemplateRef('modals-ref');

  const selected = ref<ProfileRecord | null>(null);
  const isDeleting = ref(false);

  const modals = reactive({
    create: false,
    rename: false,
    delete: false,
  });

  const names = reactive({
    create: '',
    rename: '',
  });

  const records = computed(() => profileStore.registry.profileRecords);

  function selectRow(profile: ProfileRecord) {
    selected.value = profile;
  }

  async function createProfile() {
    const name = names.create.trim();
    const result = await profileStore.createProfile(name);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else if (result.status === 'success') {
      modals.create = false;
      names.create = '';
      document.title = `${name}@${APP_NAME}`;
      router.replace({
        name: 'notes',
        params: { view: 'notes' },
      });
    }
  }

  async function deleteProfile() {
    const profileId = selected.value!.id;
    isDeleting.value = true;
    const result = await profileStore.deleteProfile(profileId);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    }
    isDeleting.value = false;
    modals.delete = false;
    selected.value = null;
  }

  async function login() {
    const profileId = selected.value!.id;
    const name = selected.value!.name;
    const result = await profileStore.login(profileId);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else if (result.status === 'success') {
      document.title = `${name}@${APP_NAME}`;
      router.replace({
        name: 'notes',
        params: { view: 'notes' },
      });
    }
  }

  function openCreateModal() {
    modalsRef.value?.openCreateModal();
  }

  function startRename() {
    modalsRef.value?.openRenameModal();
  }

  async function applyRename() {
    const profileId = selected.value!.id;
    const newName = names.rename;
    const result = await profileStore.renameProfile(profileId, newName);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      modals.rename = false;
      names.rename = '';
    }
  }

  watch(modals, () => {
    names.create = '';
    names.rename = '';
  });

  provide(LoginActionsKey, {
    modals,
    names,
    selected,
    isDeleting,
    createProfile,
    applyRename,
    deleteProfile,
  });
</script>

<template>
  <div class="flex flex-col h-screen login-page">
    <LoginPageModals ref="modals-ref" />
    <div class="flex justify-center items-center h-10 text-lg">Select or create a profile</div>
    <div class="flex grow table-container overflow-y-auto">
      <div v-if="!records.length" class="flex grow items-center justify-center">
        <div class="text-xl opacity-70 whitespace-nowrap">No profiles yet!</div>
      </div>
      <div v-else class="grow">
        <table>
          <thead class="sticky top-0">
            <tr>
              <th>Profile</th>
              <th>#Notes</th>
              <th>Created at</th>
              <th>Last access</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="profile in records"
              class="cursor-pointer"
              :class="{ selected: profile === selected }"
              @click="selectRow(profile)"
            >
              <td>{{ profile.name }}</td>
              <td>{{ profile.notes }}</td>
              <td>{{ parseTimestamp(profile.createdAt) }}</td>
              <td>{{ parseTimestamp(profile.lastAccess) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <footer class="flex p-2">
      <div class="flex grow gap-1 justify-center">
        <button type="button" class="btn-primary" @click="openCreateModal">Create</button>
        <button type="button" class="btn-primary" @click="login" :disabled="!selected">
          Select
        </button>
        <button type="button" class="btn-primary" :disabled="!selected" @click="startRename">
          Rename
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!selected"
          @click="modals.delete = true"
        >
          Delete
        </button>
      </div>
    </footer>
  </div>
</template>
