<script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUIStore } from '@renderer/store/ui';
  import { useProfileStore } from '@renderer/store/profile';
  import Header from '@renderer/components/Header/Header.vue';
  import HeaderButton from '@renderer/components/Header/HeaderButton.vue';
  import { APP_NAME } from '@common/constants';
  const profileStore = useProfileStore();
  const uiStore = useUIStore();
  const router = useRouter();
  const name = ref('');
  const fetching = ref(false);
  async function createProfile() {
    fetching.value = true;
    const result = await profileStore
      .createProfile(name.value)
      .finally(() => (fetching.value = false));
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      document.title = `${profileStore.currProfile!.name}@${APP_NAME}`;
      router.replace(profileStore.currProfile!.page);
    }
  }
</script>

<template>
  <Header v-if="profileStore.registry.profileRecords.length">
    <HeaderButton to="/login">Login</HeaderButton>
    <HeaderButton to="/signup">Create Profile</HeaderButton>
  </Header>
  <div class="flex flex-col items-center justify-center w-full flex-1">
    <div>
      <label for="profile-name" class="text-lg mr-2">Create a new profile:</label>
      <input
        v-model.trim="name"
        type="text"
        placeholder="Profile name"
        @keydown.enter="createProfile"
      />
    </div>
    <button
      type="button"
      class="btn-primary mt-5 flex items-center"
      :disabled="fetching"
      @click="createProfile"
    >
      Create
      <span v-if="fetching" class="loader ml-1"></span>
    </button>
  </div>
</template>
