<script lang="ts" setup>
  import { onMounted, onUnmounted } from 'vue';
  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
  });
  const emit = defineEmits<{
    (e: 'close'): void;
  }>();
  function close() {
    emit('close');
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.visible) {
      close();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  }
  onMounted(() => window.addEventListener('keydown', onKey));
  onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <teleport to="body">
    <div class="modal-container">
      <div v-if="props.visible" class="modal-backdrop" @click="close"></div>
      <div v-if="props.visible" class="modal">
        <div class="modal-header">
          <div>
            <slot name="header"></slot>
          </div>
          <div class="modal-close" @click="close"></div>
        </div>
        <div class="modal-body">
          <slot name="body"></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    will-change: opacity;
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 5px;
    z-index: 99999;
    will-change: opacity, transform;
  }
  .modal-header {
    font-weight: bold;
    font-size: 1.18rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
  }
  .modal-footer {
    padding: 10px;
  }
  .modal-body {
    padding: 15px;
  }
  .modal-close {
    cursor: pointer;
    width: 1.3rem;
    height: 1.3rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='gray' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z'/%3E%3Cpath fill-rule='evenodd' d='M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z'/%3E%3C/svg%3E");
    background-size: cover;
    transition: background-image 0.25s ease-out;
  }
  .modal-close:hover {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='lightgray' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z'/%3E%3Cpath fill-rule='evenodd' d='M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z'/%3E%3C/svg%3E");
  }
</style>
