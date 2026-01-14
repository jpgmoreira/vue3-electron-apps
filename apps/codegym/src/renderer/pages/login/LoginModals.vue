<script lang="ts" setup>
  import { ref } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { ProfileRecord } from '@common/schemas/profile';
  export type ModalType = 'create' | 'rename' | 'delete' | null;
  defineExpose({ show });
  const visible = ref<ModalType>(null);
  const text = ref('');
  const record = ref<ProfileRecord | null>(null);
  const isDeleting = ref(false);
  function show(which: ModalType, selected: ProfileRecord | null) {
    text.value = selected ? selected.name : '';
    record.value = selected;
    visible.value = which;
  }
  function close() {
    visible.value = null;
  }
  function create() {}
  function rename() {}
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
      <input type="text" v-model.trim="text" :placeholder="record?.name" @keydown.enter="rename" />
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
      <div v-if="isDeleting" class="text-danger flex items-center">
        <span class="loader mr-1"></span>
        Deleting...
      </div>
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
