<script lang="ts" setup>
  import Header from '@renderer/components/Header.vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { APP_HOMEPAGE, APP_NAME, APP_PRODUCT_NAME, APP_VERSION } from '@common/constants';
  import { useRouter } from 'vue-router';
  import { copyUrlToClipboard } from '@renderer/helpers/helpers';
  const router = useRouter();
  const profileStore = useProfileStore();
  const profileName = profileStore.currProfile!.name;
  async function logout() {
    await profileStore.logout();
    document.title = APP_NAME;
    router.replace('/login');
  }
</script>

<template>
  <div class="settings-page flex flex-col h-screen overflow-hidden">
    <Header />

    <div class="content">
      <h1>Settings</h1>

      <!-- Profile -->
      <section>
        <h2>Profile</h2>
        <div class="flex justify-between items-center">
          <div>{{ profileName }}</div>
          <button type="button" class="btn btn-warning" @click="logout">Logout</button>
        </div>
      </section>

      <!-- Version -->
      <section>
        <h2>Version</h2>
        <div>{{ APP_PRODUCT_NAME }} version {{ APP_VERSION }}</div>
        <div>
          Homepage:
          <a href="#" @click="copyUrlToClipboard(APP_HOMEPAGE)">{{ APP_HOMEPAGE }}</a>
        </div>
      </section>
    </div>
  </div>
</template>
