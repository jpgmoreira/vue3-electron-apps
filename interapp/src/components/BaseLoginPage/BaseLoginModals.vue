<script lang="ts" setup>
  import { inject, nextTick, useTemplateRef } from 'vue';
  import { LoginActionsKey, LoginActionsType } from './loginActions';
  import Modal from '@renderer/components/UI/Modal.vue';

  defineExpose({
    openCreateModal,
    openRenameModal,
  });

  const injected = inject<LoginActionsType>(LoginActionsKey);
  if (!injected) {
    throw new Error('LoginActions not provided');
  }
  const { modals, names, selected, isDeleting, createProfile, applyRename, deleteProfile } =
    injected;

  const createInput = useTemplateRef('create-input');
  const renameInput = useTemplateRef('rename-input');

  function openCreateModal() {
    modals.create = true;
    nextTick(() => createInput.value?.focus());
  }

  function openRenameModal() {
    names.rename = selected.value?.name || '';
    modals.rename = true;
    nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
    });
  }

  function closeDeleteModal() {
    if (isDeleting.value) return;
    modals.delete = false;
  }
</script>

<template>
  <!-- Create modal: -->
  <Modal :visible="modals.create" @close="modals.create = false">
    <template #header>New Profile</template>
    <template #body>
      <div class="mb-1">Create a new profile:</div>
      <input
        type="text"
        spellcheck="false"
        ref="create-input"
        v-model.trim="names.create"
        placeholder="Profile Name..."
        @keydown.enter="createProfile"
      />
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="modals.create = false">Cancel</button>
        <button type="button" class="btn-primary" @click="createProfile">Create</button>
      </div>
    </template>
  </Modal>

  <!-- Rename modal: -->
  <Modal :visible="modals.rename" @close="modals.rename = false">
    <template #header>Rename</template>
    <template #body>
      <div class="mb-1">Rename the "{{ selected?.name }}" profile:</div>
      <input
        type="text"
        spellcheck="false"
        ref="rename-input"
        v-model.trim="names.rename"
        :placeholder="selected?.name"
        @keydown.enter="applyRename"
      />
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="modals.rename = false">Cancel</button>
        <button type="button" class="btn-primary" @click="applyRename">Rename</button>
      </div>
    </template>
  </Modal>

  <!-- Delete modal: -->
  <Modal :visible="modals.delete" @close="closeDeleteModal">
    <template #header>Delete</template>
    <template #body>
      <div>
        Are you sure you want to delete profile
        <span class="text-danger font-bold">{{ selected?.name }}</span>
        ?
      </div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">
        <span class="loader mr-1"></span>
        Deleting...
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="deleteProfile" :disabled="isDeleting">
          Delete
        </button>
        <button
          type="button"
          class="btn-warning"
          @click="modals.delete = false"
          :disabled="isDeleting"
        >
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
