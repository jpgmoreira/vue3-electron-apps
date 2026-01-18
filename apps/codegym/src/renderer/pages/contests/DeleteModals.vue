<script lang="ts" setup>
  import { ref } from 'vue';
  import { Node } from '@interapp/components/Explorer/common/tree';
  import { DeleteNodeCallback } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import Modal from '@interapp/components/Modal.vue';
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
  const files = ref(0);
  const folders = ref(0);
  const callback = ref(async () => {});
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
    files.value = 0;
    folders.value = 0;
    visible.value = 'single';
    name.value = node.text;
    callbackFactory(_callback);
  }
  function showDeleteMultiple(_files: number, _folders: number, _callback: DeleteNodeCallback) {
    name.value = '';
    visible.value = 'multiple';
    files.value = _files;
    folders.value = _folders;
    callbackFactory(_callback);
  }
  function close() {
    if (isDeleting.value) return;
    visible.value = null;
  }
</script>

<template>
  <!-- Delete single -->
  <Modal :visible="visible === 'single'" @close="close">
    <template #header>Delete</template>
    <template #body>
      <div>
        Are you sure you want to delete
        <span class="text-danger font-bold">{{ name }}</span>
        ?
      </div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">Deleting...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="callback" :disabled="isDeleting">
          Delete
        </button>
        <button type="button" class="btn-warning" @click="close" :disabled="isDeleting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>

  <!-- Delete multiple -->
  <Modal :visible="visible === 'multiple'" @close="close">
    <template #header>Delete</template>
    <template #body>
      <div>
        Are you sure you want to delete
        <span class="font-bold">{{ files }} files</span>
        and
        <span class="font-bold">{{ folders }} folders</span>
        ?
      </div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">Deleting...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="callback" :disabled="isDeleting">
          Delete
        </button>
        <button type="button" class="btn-warning" @click="close" :disabled="isDeleting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
