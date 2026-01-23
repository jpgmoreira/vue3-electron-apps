<script lang="ts" setup>
  import { ref } from 'vue';
  import ColorPicker from './ColorPicker.vue';
  import { useToolbar } from './useToolbar';

  type Menu = null | 'textcolor' | 'backgroundcolor';

  const activeMenu = ref<Menu>(null);

  const {
    undo,
    redo,
    bold,
    italic,
    underline,
    strikeThrough,
    superscript,
    subscript,
    clear,
    increaseFontSize,
    reduceFontSize,
    changeTextColor,
    changeBackgroundColor,
  } = useToolbar();

  function colorEvent(color: string) {
    if (activeMenu.value === 'textcolor') {
      changeTextColor(color);
    } else if (activeMenu.value === 'backgroundcolor') {
      changeBackgroundColor(color);
    }
  }

  function toggleMenu(menu: Menu) {
    activeMenu.value = activeMenu.value === menu ? null : menu;
  }
</script>

<template>
  <div class="toolbar">
    <ColorPicker v-if="activeMenu" @select="colorEvent" />
    <div class="btn-container">
      <div class="toolbar-btn toolbar-undo" @mousedown.prevent="undo"></div>
      <div class="toolbar-btn toolbar-redo" @mousedown.prevent="redo"></div>
      <div class="toolbar-btn toolbar-bold" @mousedown.prevent="bold"></div>
      <div class="toolbar-btn toolbar-italic" @mousedown.prevent="italic"></div>
      <div class="toolbar-btn toolbar-underline" @mousedown.prevent="underline"></div>
      <div class="toolbar-btn toolbar-strikeThrough" @mousedown.prevent="strikeThrough"></div>
      <div class="toolbar-btn toolbar-superscript" @mousedown.prevent="superscript"></div>
      <div class="toolbar-btn toolbar-subscript" @mousedown.prevent="subscript"></div>
      <div class="toolbar-btn toolbar-clear" @mousedown.prevent="clear"></div>
      <div
        class="toolbar-btn toolbar-increase-font-size"
        @mousedown.prevent="increaseFontSize"
      ></div>
      <div class="toolbar-btn toolbar-reduce-font-size" @mousedown.prevent="reduceFontSize"></div>
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
