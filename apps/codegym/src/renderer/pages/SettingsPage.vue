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
  <div class="settings-page">
    <SettingsPageHeader />

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
            <td>
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
</template>

<style scoped></style>
