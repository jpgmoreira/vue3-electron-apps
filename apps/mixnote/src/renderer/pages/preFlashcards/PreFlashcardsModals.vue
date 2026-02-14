<script lang="ts" setup>
  import { InvokeChannels } from '@preload/channels/invoke';
  import { ref, computed } from 'vue';
  import Modal from '@interapp/components/Modal.vue';
  import { sleep } from '@interapp/utils/utils';
  import { NoteFrequency } from '@common/schemas/notes';

  type ModalType = 'bucket' | 'high' | 'low';

  const emit = defineEmits<{
    (e: 'cleared'): void;
  }>();

  const visible = ref<ModalType | null>(null);
  const isRequesting = ref(false);
  const nNotes = ref(0);

  const word = computed(() => (nNotes.value !== 1 ? 'notes' : 'note'));

  function clear() {
    visible.value = null;
    isRequesting.value = false;
    nNotes.value = 0;
  }

  function close() {
    if (isRequesting.value) return;
    clear();
  }

  function show(which: ModalType, _nNotes: number) {
    nNotes.value = _nNotes;
    visible.value = which;
  }

  async function doRequest(channel: InvokeChannels, frequency?: NoteFrequency) {
    isRequesting.value = true;
    try {
      await sleep(1000);
      await window.api.invoke(channel, frequency);
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
  <!-- Bucket -->
  <Modal :visible="visible === 'bucket'" @close="close">
    <template #header>Empty review bucket</template>
    <template #body>
      <div>
        This will remove
        <b>{{ nNotes }} {{ word }}</b>
        from the bucket.
      </div>
      <div v-if="isRequesting" class="flex items-center">Processing...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="btn-warning"
          @click="doRequest(InvokeChannels.clearFilteredBucket)"
          :disabled="isRequesting"
        >
          Proceed
        </button>
        <button type="button" class="btn-primary" @click="close" :disabled="isRequesting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>

  <!-- High -->
  <Modal :visible="visible === 'high'" @close="close">
    <template #header>Clear high frequency</template>
    <template #body>
      <div>
        This will clear the frequency of
        <b>{{ nNotes }} high-frequency</b>
        selected {{ word }}.
      </div>
      <div v-if="isRequesting" class="flex items-center">Processing...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="btn-warning"
          @click="doRequest(InvokeChannels.clearFilteredFrequency, 'high')"
          :disabled="isRequesting"
        >
          Proceed
        </button>
        <button type="button" class="btn-primary" @click="close" :disabled="isRequesting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>

  <!-- Low -->
  <Modal :visible="visible === 'low'" @close="close">
    <template #header>Clear low frequency</template>
    <template #body>
      <div>
        This will clear the frequency of
        <b>{{ nNotes }} low-frequency</b>
        selected {{ word }}.
      </div>
      <div v-if="isRequesting" class="flex items-center">Processing...</div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="btn-warning"
          @click="doRequest(InvokeChannels.clearFilteredFrequency, 'low')"
          :disabled="isRequesting"
        >
          Proceed
        </button>
        <button type="button" class="btn-primary" @click="close" :disabled="isRequesting">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
