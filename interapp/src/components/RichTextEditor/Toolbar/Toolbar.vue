<script lang="ts" setup>
  import { ref } from 'vue';
  import ColorPicker from './ColorPicker.vue';

  type Menu = null | 'textcolor' | 'backgroundcolor';

  // Which menu is currently active for showing the color picker:
  const activeMenu = ref<Menu>(null);

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
    (e: 'textColor', color: string): void;
    (e: 'backgroundColor', color: string): void;
  }>();

  function emitColorEvent(color: string) {
    if (!activeMenu.value) throw new Error('No active menu set!');
    if (activeMenu.value === 'textcolor') {
      emit('textColor', color);
    } else if (activeMenu.value === 'backgroundcolor') {
      emit('backgroundColor', color);
    }
  }

  function toggleMenu(menu: Menu) {
    if (menu === activeMenu.value) {
      activeMenu.value = null;
    } else {
      activeMenu.value = menu;
    }
  }
</script>

<template>
  <div class="toolbar">
    <div class="btn-container">
      <div class="toolbar-btn toolbar-undo" @mousedown.prevent="emit('undo')"></div>
      <div class="toolbar-btn toolbar-redo" @mousedown.prevent="emit('redo')"></div>
      <div class="toolbar-btn toolbar-bold" @mousedown.prevent="emit('bold')"></div>
      <div class="toolbar-btn toolbar-italic" @mousedown.prevent="emit('italic')"></div>
      <div class="toolbar-btn toolbar-underline" @mousedown.prevent="emit('underline')"></div>
      <div
        class="toolbar-btn toolbar-strikeThrough"
        @mousedown.prevent="emit('strikeThrough')"
      ></div>
      <div class="toolbar-btn toolbar-superscript" @mousedown.prevent="emit('superscript')"></div>
      <div class="toolbar-btn toolbar-subscript" @mousedown.prevent="emit('subscript')"></div>
      <div class="toolbar-btn toolbar-clear" @mousedown.prevent="emit('clear')"></div>
      <div
        class="toolbar-btn toolbar-increase-font-size"
        @mousedown.prevent="emit('increase-font-size')"
      ></div>
      <div
        class="toolbar-btn toolbar-reduce-font-size"
        @mousedown.prevent="emit('reduce-font-size')"
      ></div>
      <div
        class="toolbar-btn toolbar-textcolor"
        :class="{ active: activeMenu === 'textcolor' }"
        @mousedown.prevent="toggleMenu('textcolor')"
      ></div>
      <div
        class="toolbar-btn toolbar-backgroundcolor"
        :class="{ active: activeMenu === 'backgroundcolor' }"
        @mousedown.prevent="toggleMenu('backgroundcolor')"
      ></div>
    </div>
    <ColorPicker v-if="activeMenu" @select="emitColorEvent" />
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
