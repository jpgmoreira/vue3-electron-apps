<script lang="ts" setup>
  import Modal from '@interapp/components/Modal.vue';
  const props = defineProps<{
    visible: boolean;
    message: string;
    isDeleting: boolean;
  }>();
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'delete'): void;
  }>();
</script>

<template>
  <Modal :visible="props.visible" @close="emit('close')">
    <template #header>Delete</template>
    <template #body>
      <div>{{ props.message }}</div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="props.isDeleting" class="text-danger flex items-center">
        <span class="loader mr-1"></span>
        Deleting...
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="emit('delete')" :disabled="isDeleting">
          Delete
        </button>
        <button type="button" class="btn-warning" @click="emit('close')" :disabled="isDeleting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
