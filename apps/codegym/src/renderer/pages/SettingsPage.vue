<script lang="ts" setup>
  import { computed } from 'vue';
  import { OjNames, OjList, Oj } from '@common/types/oj';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import { useToastStore } from '@interapp/store/toast';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { useRouter } from 'vue-router';
  import packageJson from '../../../package.json';
  import SettingsPageHeader from '@renderer/components/Header/SettingsPageHeader.vue';
  import { APP_NAME } from '@common/constants';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const ojStatusStore = useOjStatusStore();
  const toastStore = useToastStore();
  const router = useRouter();
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
  function handleLogout() {
    profileStore.logout();
    document.title = APP_NAME;
    router.replace('/login');
  }
  function copyHomePage() {
    navigator.clipboard
      .writeText(packageJson.homepage)
      .then(() => {
        toastStore.showToast('URL copied to the clipboard!', 'success');
      })
      .catch(() => {
        toastStore.showToast('Error on copying URL!', 'error');
      });
  }
</script>

<template>
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
    <div class="flex">
      <div>
        <div>Profile: {{ currProfileName }}</div>
      </div>
      <button type="button" class="btn-warning" @click="handleLogout">Logout</button>
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
