<script lang="ts" setup>
  import { ref } from 'vue';
  import Toolbar from './Toolbar.vue';

  // --- Emits: ---

  const emit = defineEmits<{
    (e: 'blur'): void;
  }>();

  // --- Variables: ---

  const isToolbarVisible = ref(false);

  // --- Functions: ---

  function focus() {
    isToolbarVisible.value = true;
    rteRef.value?.focus();
  }

  function blur() {
    isToolbarVisible.value = false;
    isCtxVisible.value = false;
    emit('blur');
    clearSelectedImage();
  }

  // -- Toolbar events: ---

  function undo() {
    document.execCommand('undo');
  }

  function redo() {
    document.execCommand('redo');
  }
  function bold() {
    document.execCommand('bold');
  }

  function italic() {
    document.execCommand('italic');
  }

  function underline() {
    document.execCommand('underline');
  }

  function strikeThrough() {
    document.execCommand('strikeThrough');
  }

  function superscript() {
    document.execCommand('superscript');
  }

  function subscript() {
    document.execCommand('subscript');
  }

  function resizeText(size: string) {
    document.execCommand('fontSize', false, size);
  }

  function clear() {
    const selection = window.getSelection();
    if (selection?.type === 'Caret') {
      // the current selection is collapsed.
      document.execCommand('insertText', false, ' ');
      selection.modify('extend', 'left', 'character');
    }
    // trick to remove subscript and superscript.
    document.execCommand('superscript');
    document.execCommand('subscript');
    document.execCommand('subscript');
    // necessary to call twice because of a bug with clearing the text background color.
    document.execCommand('removeFormat');
    document.execCommand('removeFormat');
  }

  function changeTextColor(color: string) {
    document.execCommand('foreColor', false, color);
  }

  function changeBackgroundColor(color: string) {
    document.execCommand('backColor', false, color);
  }
</script>

<template>
  <div class="rte-root">
    <div @focus="focus" @blur="blur"></div>
    <Toolbar
      v-if="isToolbarVisible"
      @undo="undo"
      @redo="redo"
      @bold="bold"
      @italic="italic"
      @underline="underline"
      @strike-through="strikeThrough"
      @resize-text="resizeText"
      @superscript="superscript"
      @subscript="subscript"
      @clear="clear"
      @text-color="changeTextColor"
      @background-color="changeBackgroundColor"
    />
  </div>
</template>

<style scoped>
  .rte-root {
    max-width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .rte {
    flex-grow: 1;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: normal;
    word-break: normal;
  }
</style>
