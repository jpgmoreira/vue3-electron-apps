<script lang="ts" setup>
  import { computed } from 'vue';
  import { Oj, OjList, OjNames } from '@common/schemas/oj';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import { useProfileStore } from '@renderer/store/profile';
  import { APP_HOMEPAGE, APP_NAME, APP_PRODUCT_NAME, APP_VERSION } from '@common/constants';
  import { copyUrlToClipboard } from '@renderer/helpers/helpers';
  import { useRouter } from 'vue-router';
  const router = useRouter();
  const ojMetaStore = useOjMetaStore();
  const ojStatusStore = useOjStatusStore();
  const profileStore = useProfileStore();
  const isUpdatingCache = computed(
    () =>
      Object.fromEntries(OjList.map((oj) => [oj, ojStatusStore[oj].isUpdatingCache])) as Record<
        Oj,
        boolean
      >
  );
  const profileName = profileStore.currProfile!.name;
  function lastCacheUpdate(oj: Oj): string | null {
    const timestamp = ojMetaStore.ojMeta[oj].lastCacheUpdate;
    if (timestamp) return parseTimestamp(timestamp);
    return null;
  }
  function updateCache(oj: Oj) {
    ojStatusStore.updateOjCache(oj);
  }
  function logout() {
    profileStore.logout();
    document.title = APP_NAME;
    router.replace('/login');
  }
</script>

<template>
  <div class="settings-page flex flex-col h-screen overflow-hidden">
    <SettingsPageHeader />

    <div class="overflow-y-auto grow">
      <!-- Cache -->
      <section>
        <h1>Cache</h1>
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
                <!-- Interesting: we don't need an arrow function here at @click: -->
                <div class="flex justify-center">
                  <button
                    type="button"
                    class="btn-primary"
                    :disabled="isUpdatingCache[oj]"
                    @click="updateCache(oj)"
                  >
                    <span>{{ isUpdatingCache[oj] ? 'Updating...' : 'Update' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Profile -->
      <section>
        <h1>Profile</h1>
        <div class="flex justify-between items-center">
          <div>{{ profileName }}</div>
          <button type="button" class="btn btn-warning" @click="logout">Logout</button>
        </div>
      </section>

      <!-- Version -->
      <section>
        <h1>Version</h1>
        <div>{{ APP_PRODUCT_NAME }} version {{ APP_VERSION }}</div>
        <div>
          Homepage:
          <a href="#" @click="copyUrlToClipboard(APP_HOMEPAGE)">{{ APP_HOMEPAGE }}</a>
        </div>
      </section>
    </div>
  </div>
</template>
