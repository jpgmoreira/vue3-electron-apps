<script lang="ts" setup>
  // Toolbar actions that do not have parameters:
  type SimpleToolbarAction =
    | 'undo'
    | 'redo'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikeThrough'
    | 'superscript'
    | 'subscript'
    | 'clear'
    | 'increase-font-size'
    | 'reduce-font-size';

  const emit = defineEmits<{
    (e: SimpleToolbarAction): void;

    // Toolbar actions that have parameters:
    (e: 'resizeText', size: string): void;
    (e: 'textColor', color: string): void;
    (e: 'backgroundColor', color: string): void;
  }>();
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-btn toolbar-undo" @click="emit('undo')"></div>
    <div class="toolbar-btn toolbar-redo" @emit="emit('redo')"></div>
    <div class="toolbar-btn toolbar-bold" @emit="emit('bold')"></div>
    <div class="toolbar-btn toolbar-italic" @emit="emit('italic')"></div>
    <div class="toolbar-btn toolbar-underline" @emit="emit('underline')"></div>
    <div class="toolbar-btn toolbar-strikeThrough" @emit="emit('strikeThrough')"></div>
    <div class="toolbar-btn toolbar-superscript" @emit="emit('superscript')"></div>
    <div class="toolbar-btn toolbar-subscript" @emit="emit('subscript')"></div>
    <div class="toolbar-btn toolbar-clear" @emit="emit('clear')"></div>
    <div class="toolbar-btn toolbar-increase-font-size" @emit="emit('increase-font-size')"></div>
    <div class="toolbar-btn toolbar-reduce-font-size" @emit="emit('reduce-font-size')"></div>
    <div class="toolbar-btn toolbar-textcolor"></div>
    <div class="toolbar-btn toolbar-backgroundcolor"></div>
  </div>
</template>

<style scoped>
  .toolbar-undo {
    background-image: url('./assets/undo.png');
  }
  .toolbar-redo {
    background-image: url('./assets/redo.png');
  }
  .toolbar-bold {
    background-image: url('./assets/bold.png');
  }
  .toolbar-italic {
    background-image: url('./assets/italic.png');
  }
  .toolbar-underline {
    background-image: url('./assets/underline.png');
  }
  .toolbar-strikeThrough {
    background-image: url('./assets/strikethrough.png');
  }
  .toolbar-superscript {
    background-image: url('./assets/superscript.png');
  }
  .toolbar-subscript {
    background-image: url('./assets/subscript.png');
  }
  .toolbar-clear {
    background-image: url('./assets/clear.png');
  }
  .toolbar-increase-font-size {
    background-image: url('./assets/increase-font-size.png');
  }
  .toolbar-reduce-font-size {
    background-image: url('./assets/reduce-font-size.png');
  }
  .toolbar-textcolor {
    background-image: url('./assets/textcolor.png');
  }
  .toolbar-backgroundcolor {
    background-image: url('./assets/backgroundcolor.png');
  }
</style>
