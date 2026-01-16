<script lang="ts" setup>
  import { computed } from 'vue';
  import { Oj, OjList, OjNames } from '@common/schemas/oj';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import SettingsPageHeader from '@renderer/components/header/SettingsPageHeader.vue';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import { useProfileStore } from '@renderer/store/profile';
  import { APP_HOMEPAGE, APP_PRODUCT_NAME, APP_VERSION } from '@common/constants';
  import { copyUrlToClipboard } from '@renderer/helpers/helpers';
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
</script>

<template>
  <div class="settings-page flex flex-col h-screen overflow-hidden">
    <SettingsPageHeader />

    <div class="overflow-y-auto grow">
      <!-- Cache -->
      <section class="cache-settings">
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
              <td class="flex justify-center">
                <!-- Interesting: we don't need an arrow function here at @click: -->
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="isUpdatingCache[oj]"
                  @click="updateCache(oj)"
                >
                  <span>{{ isUpdatingCache[oj] ? 'Updating...' : 'Update' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Profile -->
      <section class="profile-settings">
        <h1>Profile</h1>
        <div class="flex justify-between items-center">
          <div>{{ profileName }}</div>
          <button type="button" class="btn btn-warning">Logout</button>
        </div>
      </section>

      <!-- Version -->
      <section class="version-settings">
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

<style scoped>
  /* Sections as cards */
  .settings-page section {
    background: #1f2223;
    border-radius: 12px;
    padding: 24px;
    margin: 15px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Titles */
  .settings-page h1 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #e5e7eb;
    letter-spacing: 0.3px;
  }
</style>
