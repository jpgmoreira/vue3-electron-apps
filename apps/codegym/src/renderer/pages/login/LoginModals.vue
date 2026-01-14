<script lang="ts" setup>
  import { ref, useTemplateRef, nextTick } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { ProfileRecord } from '@common/schemas/profile';
  import { useProfileStore } from '@renderer/store/profile';
  import { useToastStore } from '@interapp/store/toast';
  import { APP_NAME } from '@common/constants';
  import { useRouter } from 'vue-router';
  export type ModalType = 'create' | 'rename' | 'delete' | null;
  defineExpose({ show });
  const profileStore = useProfileStore();
  const toastStore = useToastStore();
  const router = useRouter();
  const visible = ref<ModalType>(null);
  const text = ref('');
  const record = ref<ProfileRecord | null>(null);
  const isDeleting = ref(false);
  const createInput = useTemplateRef('create-input');
  const renameInput = useTemplateRef('rename-input');
  function show(which: ModalType, selected: ProfileRecord | null) {
    text.value = selected ? selected.name : '';
    if (which === 'create') text.value = '';
    record.value = selected;
    visible.value = which;
    nextTick(() => {
      if (which === 'create') {
        createInput.value?.focus();
      } else if (which === 'rename') {
        renameInput.value?.focus();
        renameInput.value?.select();
      }
    });
  }
  function close() {
    visible.value = null;
  }
  async function create() {
    const name = text.value.trim();
    const result = await profileStore.createProfile(name);
    if (result.status === 'error') {
      toastStore.showToast(result.message, 'error');
    } else if (result.status === 'success') {
      visible.value = null;
      document.title = `${name}@${APP_NAME}`;
      router.replace('/problems');
    }
  }
  async function rename() {
    if (!record.value) throw new Error('No record selected!');
    const profileId = record.value.id;
    const newName = text.value.trim();
    const result = await profileStore.renameProfile(profileId, newName);
    if (result.status === 'error') {
      toastStore.showToast(result.message!, 'error');
    } else {
      visible.value = null;
    }
  }
  function _delete() {}
</script>

<template>
  <!-- Create modal: -->
  <Modal :visible="visible === 'create'" @close="close">
    <template #header>New Profile</template>
    <template #body>
      <div class="mb-1">Create a new profile:</div>
      <input
        type="text"
        spellcheck="false"
        ref="create-input"
        v-model.trim="text"
        placeholder="Profile Name..."
        @keydown.enter="create"
      />
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="close">Cancel</button>
        <button type="button" class="btn-primary" @click="create">Create</button>
      </div>
    </template>
  </Modal>

  <!-- Rename modal: -->
  <Modal :visible="visible === 'rename'" @close="close">
    <template #header>Rename</template>
    <template #body>
      <div class="mb-1">Rename the "{{ record?.name }}" profile:</div>
      <input
        type="text"
        spellcheck="false"
        ref="rename-input"
        v-model.trim="text"
        :placeholder="record?.name"
        @keydown.enter="rename"
      />
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="close">Cancel</button>
        <button type="button" class="btn-primary" @click="rename">Rename</button>
      </div>
    </template>
  </Modal>

  <!-- Delete modal: -->
  <Modal :visible="visible === 'delete'" @close="close">
    <template #header>Delete</template>
    <template #body>
      <div>
        Are you sure you want to delete profile
        <span class="text-danger font-bold">{{ record?.name }}</span>
        ?
      </div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">Deleting...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="_delete" :disabled="isDeleting">
          Delete
        </button>
        <button type="button" class="btn-warning" @click="close" :disabled="isDeleting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
