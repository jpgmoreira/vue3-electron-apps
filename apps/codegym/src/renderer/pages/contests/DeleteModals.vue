<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { Node } from '@interapp/components/Explorer/common/tree';
  import { DeleteNodeCallback } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import DeletionModal from '@interapp/components/DeletionModal.vue';
  defineExpose({
    showDeleteSingle,
    showDeleteMultiple,
  });
  const emit = defineEmits<{
    (e: 'deleted'): void;
  }>();
  const visible = ref<'single' | 'multiple' | null>(null);
  const isDeleting = ref(false);
  const name = ref('');
  const deleteFiles = ref(0);
  const deleteFolders = ref(0);
  const callback = ref(async () => {});

  const deleteMultipleText = computed(() => {
    const files = deleteFiles.value;
    const folders = deleteFolders.value;
    const filesText = `${files} note${files !== 1 ? 's' : ''}`;
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

  function callbackFactory(_callback: DeleteNodeCallback) {
    callback.value = async () => {
      isDeleting.value = true;
      try {
        await _callback();
        emit('deleted');
      } finally {
        visible.value = null;
        isDeleting.value = false;
      }
    };
  }
  function showDeleteSingle(node: Node, _callback: DeleteNodeCallback) {
    deleteFiles.value = 0;
    deleteFolders.value = 0;
    visible.value = 'single';
    name.value = node.text;
    callbackFactory(_callback);
  }
  function showDeleteMultiple(_files: number, _folders: number, _callback: DeleteNodeCallback) {
    name.value = '';
    visible.value = 'multiple';
    deleteFiles.value = _files;
    deleteFolders.value = _folders;
    callbackFactory(_callback);
  }
  function close() {
    if (isDeleting.value) return;
    visible.value = null;
  }
</script>

<template>
  <!-- Delete single -->
  <DeletionModal
    :visible="visible === 'single'"
    :is-deleting="isDeleting"
    :text="name"
    @close="close"
    @delete="callback"
  />

  <!-- Delete multiple -->
  <DeletionModal
    :visible="visible === 'multiple'"
    :is-deleting="isDeleting"
    :text="deleteMultipleText"
    @close="close"
    @delete="callback"
  />
</template>
