<script lang="ts" setup>
  import { InvokeChannels } from '@preload/channels/invoke';
  import { ref } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { sleep } from '@interapp/utils/utils';

  const emit = defineEmits<{
    (e: 'cleared'): void;
  }>();

  const visible = ref(false);
  const isRemoving = ref(false);
  const nCards = ref(0);

  function clear() {
    visible.value = false;
    isRemoving.value = false;
    nCards.value = 0;
  }

  function close() {
    if (isRemoving.value) return;
    clear();
  }

  function show(_nCards: number) {
    nCards.value = _nCards;
    visible.value = true;
  }

  async function remove() {
    isRemoving.value = true;
    try {
      await sleep(1000);
      await window.api.invoke(InvokeChannels.clearFilteredBucket);
      emit('cleared');
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
    <template #header>Clear review bucket</template>
    <template #body>
      <div>This will remove {{ nCards }} cards from the bucket.</div>
      <div v-if="isRemoving" class="flex items-center">Removing...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button type="button" class="btn-warning" @click="remove" :disabled="isRemoving">
          Proceed
        </button>
        <button type="button" class="btn-primary" @click="close" :disabled="isRemoving">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
