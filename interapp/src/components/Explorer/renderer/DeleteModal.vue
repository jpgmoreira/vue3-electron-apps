<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { ModalState } from './TreeView.vue';
  import Modal from '../Modal.vue';

  const props = defineProps<{
    modalState: ModalState;
    closeModal: () => void;
    tree: TreeOperationResponseDTO | null;
    nSelectedFolders: number;
    handleDeletion: () => void;
  }>();
</script>

<template>
  <Modal :visible="modalState.visible" @close="closeModal">
    <template #header>
      <div v-if="!modalState.multiple && modalState.currentNode?.type === 'dir'">
        Delete folder
        <strong>"{{ modalState.currentNode.text }}"</strong>
      </div>
      <div v-else-if="!modalState.multiple && modalState.currentNode?.type === 'file'">
        Delete note
        <strong>"{{ modalState.currentNode.text }}"</strong>
      </div>
      <div v-else>Delete selection</div>
    </template>
    <template #body>
      <div class="flex flex-col text-center">
        <template v-if="!modalState.multiple && modalState.currentNode">
          <span>
            Are you sure you want to delete the
            <strong>"{{ modalState.currentNode.text }}"</strong>
            {{ modalState.currentNode.type === 'dir' ? 'folder' : 'note' }}?
          </span>
          <span class="text-danger my-2">This action cannot be undone!</span>
          <div v-if="modalState.isDeleting" class="text-danger flex items-center">
            <span class="loader mr-2"></span>
            Deleting...
          </div>
        </template>
        <template v-else>
          <span>
            Are you sure you want to delete
            <strong>{{ tree?.nSelectedFiles || 0 }}</strong>
            {{ tree?.nSelectedFiles === 1 ? 'note' : 'notes' }}
            and
            <strong>{{ nSelectedFolders }}</strong>
            {{ nSelectedFolders === 1 ? 'folder' : 'folders' }}?
          </span>
          <span class="text-danger my-2">This action cannot be undone!</span>
          <div v-if="modalState.isDeleting" class="text-danger flex items-center">
            <span class="loader mr-2"></span>
            Deleting...
          </div>
        </template>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="btn-secondary"
          :disabled="modalState.isDeleting"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn-danger"
          :disabled="modalState.isDeleting"
          @click="handleDeletion"
        >
          Delete
        </button>
      </div>
    </template>
  </Modal>
</template>
