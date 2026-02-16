<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { ref } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { sleep } from '@interapp/utils/utils';
  import DeletionModal from '@interapp/components/DeletionModal.vue';

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
  <DeletionModal
    :visible="visible"
    :is-deleting="isDeleting"
    :text="'this card'"
    @close="close"
    @delete="doDelete"
  />
</template>
