<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { OjNames, OjList, Oj } from '@common/types/oj';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import { useUIStore } from '@renderer/store/ui';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { useRouter } from 'vue-router';
  import packageJson from '../../../package.json';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import Modal from '@renderer/components/UI/Modal.vue';
  import { APP_NAME } from '@common/constants';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const ojStatusStore = useOjStatusStore();
  const uiStore = useUIStore();
  const router = useRouter();
  const name = ref<string>(profileStore.currProfile!.name);
  const modalVisible = ref<boolean>(false);
  const isUpdatingCache = computed(
    () =>
      Object.fromEntries(OjList.map((oj) => [oj, ojStatusStore[oj].isUpdatingCache])) as Record<
        Oj,
        boolean
      >
  );
  const currProfileName = computed(() => profileStore.currProfile?.name);
  function lastCacheUpdate(oj: Oj): string | null {
    const timestamp = ojMetaStore.ojMeta[oj].lastCacheUpdate;
    if (timestamp) return parseTimestamp(timestamp);
    return null;
  }
  function updateCache(oj: Oj) {
    ojStatusStore.updateOjCache(oj);
  }
  async function handleRename() {
    const newName = name.value.trim();
    if (!newName) {
      uiStore.showToast('Profile name cannot be empty!', 'error');
      return;
    }
    const result = await profileStore.renameCurrProfile(newName);
    if (result.status === 'success') {
      uiStore.showToast('Profile renamed successfully!', 'success');
      document.title = `${newName}@${APP_NAME}`;
    } else {
      uiStore.showToast(result.errorMsg, 'error');
    }
  }
  function handleLogout() {
    profileStore.logout();
    document.title = APP_NAME;
    router.replace('/login');
  }
  function handleDelete() {
    profileStore.deleteProfile();
    document.title = APP_NAME;
    if (profileStore.registry.profileRecords.length) {
      router.replace('/login');
    } else {
      router.replace('/signup');
    }
  }
  function closeModal() {
    modalVisible.value = false;
  }
  function copyHomePage() {
    navigator.clipboard
      .writeText(packageJson.homepage)
      .then(() => {
        uiStore.showToast('URL copied to the clipboard!', 'success');
      })
      .catch(() => {
        uiStore.showToast('Error on copying URL!', 'error');
      });
  }
</script>

<template>
  <Modal :visible="modalVisible" @close="closeModal">
    <template #header>Delete Profile</template>
    <template #body>
      <div class="flex flex-col text-center">
        <span>Are you sure you want to delete the current profile ({{ currProfileName }})?</span>
        <span class="text-danger text-xl my-2">This action cannot be undone!</span>
        <span class="text-danger">
          The deletion of a profile will result in the deletion of all its data!
        </span>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
        <button type="button" class="btn-danger" @click="handleDelete">Delete</button>
      </div>
    </template>
  </Modal>
  <SettingsPageHeader />
  <!-- Cache -->
  <div>
    <h1 class="text-2xl p-2">Cache</h1>
    <table class="table-fixed w-full">
      <thead>
        <tr>
          <th class="w-1/3">OJ</th>
          <th class="w-1/3">Last Updated</th>
          <th class="w-1/3"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="oj in OjList" :key="oj">
          <td>{{ OjNames[oj] }}</td>
          <td>{{ lastCacheUpdate(oj) || 'Never' }}</td>
          <td>
            <!-- Interestingly, we don't need an arrow function here: -->
            <button
              type="button"
              class="btn-primary"
              :disabled="isUpdatingCache[oj]"
              @click="updateCache(oj)"
            >
              <span v-if="isUpdatingCache[oj]" class="flex items-center">
                Updating...
                <span class="loader ml-1"></span>
              </span>
              <span v-else>Update</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- Profile -->
  <hr class="m-5 mb-2" />
  <div class="p-2">
    <h1 class="text-2xl">Profile</h1>
    <div class="flex items-center px-5">
      <label for="profile-name" class="mr-1">Profile name:</label>
      <input
        id="profile-name"
        v-model.trim="name"
        type="text"
        name="profile-name"
        @keydown.enter="handleRename"
      />
      <button type="button" class="btn-primary ml-1" @click="handleRename">Rename</button>
    </div>
    <div class="flex justify-between px-5">
      <button type="button" class="btn-warning" @click="handleLogout">Logout</button>
      <button type="button" class="btn-danger" @click="modalVisible = true">Delete Profile</button>
    </div>
  </div>
  <!-- Version -->
  <hr class="m-5 mb-2" />
  <div class="p-2">
    <h1 class="text-2xl">Version</h1>
    <div class="px-5">
      <div>{{ APP_NAME }} &ndash; Version {{ packageJson.version }}</div>
      <div>
        Homepage:
        <a href="#" @click="copyHomePage">{{ packageJson.homepage }}</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
  table td,
  table th {
    text-align: center;
  }
</style>
