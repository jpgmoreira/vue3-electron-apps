<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { ref } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { sleep } from '@interapp/utils/utils';

  const emit = defineEmits<{
    (e: 'deleted'): void;
  }>();

  const card = ref<Card | null>(null);

  const visible = ref(false);
  const isDeleting = ref(false);

  function clear() {
    visible.value = false;
    isDeleting.value = false;
  }

  function close() {
    if (isDeleting.value) return;
    clear();
  }

  function show(_card: Card) {
    card.value = _card;
    visible.value = true;
  }

  async function doDelete() {
    if (!card.value) throw new Error('Card not set!');
    isDeleting.value = true;
    try {
      await sleep(1000);
      await window.api.invoke(InvokeChannels.deleteCard, card.value.id);
      emit('deleted');
    } finally {
      clear();
    }
  }

  defineExpose({
    show,
  });
</script>

<template>
  <Modal :visible="visible" @close="close">
    <template #header>Delete</template>
    <template #body>
      <div>Are you sure you want to delete this card?</div>
      <div class="text-danger flex justify-center">This action cannot be undone!</div>
      <div v-if="isDeleting" class="text-danger flex items-center">Deleting...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-danger" @click="doDelete" :disabled="isDeleting">
          Delete
        </button>
        <button type="button" class="btn-warning" @click="close" :disabled="isDeleting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
