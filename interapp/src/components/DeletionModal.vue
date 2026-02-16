<script lang="ts" setup>
  import { computed } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  const props = defineProps<{
    visible: boolean;
    isDeleting: boolean;
    text?: string;
    textDanger?: boolean;
  }>();
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'delete'): void;
  }>();
  const textClass = computed(() => (props.textDanger ? 'text-danger font-bold' : ''));
  function close() {
    emit('close');
  }
  function doDelete() {
    emit('delete');
  }
</script>

<template>
  <Modal :visible="visible" @close="close">
    <template #header>Delete</template>
    <template #body>
      <div>
        Are you sure you want to delete
        <span :class="textClass">{{ text }}</span>
        ?
      </div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">Deleting...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="close" :disabled="isDeleting">
          Cancel
        </button>
        <button type="button" class="btn-danger" @click="doDelete" :disabled="isDeleting">
          Delete
        </button>
      </div>
    </template>
  </Modal>
</template>
