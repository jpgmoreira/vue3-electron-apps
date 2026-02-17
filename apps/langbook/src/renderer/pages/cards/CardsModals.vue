<script setup lang="ts">
  import { Node } from '@interapp/components/Explorer/common/tree';
  import { ref, computed } from 'vue';
  import { DeleteNodeCallback } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { sleep } from '@interapp/utils/utils';
  import DeletionModal from '@interapp/components/DeletionModal.vue';

  export type ModalType = 'single' | 'multiple' | null;

  const emit = defineEmits<{
    (e: 'deleted'): void;
  }>();

  const visible = ref<ModalType>(null);
  const deleteNode = ref<Node | null>(null);
  const deleteFiles = ref(0);
  const deleteFolders = ref(0);
  const isDeleting = ref(false);
  const callback = ref<DeleteNodeCallback | null>(null);

  const deleteMultipleText = computed(() => {
    const files = deleteFiles.value;
    const folders = deleteFolders.value;
    const filesText = `${files} session${files !== 1 ? 's' : ''}`;
    const foldersText = `${folders} folder${folders !== 1 ? 's' : ''}`;
    if (files && folders) {
      return `${filesText} and ${foldersText}`;
    } else if (files && !folders) {
      return filesText;
    } else if (!files && folders) {
      return foldersText;
    }
    return '';
  });

  function showDeleteSingle(node: Node, _callback: DeleteNodeCallback) {
    clear();
    callback.value = _callback;
    deleteNode.value = node;
    visible.value = 'single';
  }

  function showDeleteMultiple(files: number, folders: number, _callback: DeleteNodeCallback) {
    clear();
    callback.value = _callback;
    deleteFiles.value = files;
    deleteFolders.value = folders;
    visible.value = 'multiple';
  }

  function close() {
    if (isDeleting.value) return;
    clear();
  }

  function clear() {
    visible.value = null;
    deleteNode.value = null;
    isDeleting.value = false;
    callback.value = null;
    deleteFiles.value = 0;
    deleteFolders.value = 0;
  }

  async function doDelete() {
    if (!callback.value) throw new Error('Delete callback not set!');
    isDeleting.value = true;
    try {
      await sleep(1000);
      await callback.value();
      emit('deleted');
    } finally {
      clear();
    }
  }

  defineExpose({
    showDeleteMultiple,
    showDeleteSingle,
  });
</script>

<template>
  <!-- Delete single: -->
  <DeletionModal
    :visible="visible === 'single'"
    :is-deleting="isDeleting"
    :text="deleteNode?.text"
    text-danger
    @close="close"
    @delete="doDelete"
  />

  <!-- Delete multiple: -->
  <DeletionModal
    :visible="visible === 'multiple'"
    :is-deleting="isDeleting"
    :text="deleteMultipleText"
    text-danger
    @close="close"
    @delete="doDelete"
  />
</template>
