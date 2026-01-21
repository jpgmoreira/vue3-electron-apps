<script lang="ts" setup>
  import { ref } from 'vue';
  import ColorPicker from './ColorPicker.vue';

  // Toolbar actions that do not use parameters:
  type SimpleToolbarAction =
    | 'undo'
    | 'redo'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikeThrough'
    | 'superscript'
    | 'subscript'
    | 'clear';

  type ToolboxType = '' | 'resize' | 'backgroundcolor' | 'textcolor';

  // Here we emit simple toolbar actions and also actions that
  // contain some parameter.
  const emit = defineEmits<{
    (e: SimpleToolbarAction): void;
    (e: 'resizeText', size: string): void;
    (e: 'textColor', color: string): void;
    (e: 'backgroundColor', color: string): void;
  }>();

  const currentDropdown = ref<ToolboxType>('');

  function updateCurrentDropdown(menu: ToolboxType) {
    currentDropdown.value = currentDropdown.value === menu ? '' : menu;
  }

  function toolbarAction(action: SimpleToolbarAction) {
    updateCurrentDropdown('');
    emit(action);
  }
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-btn toolbar-undo" @mousedown.prevent="toolbarAction('undo')"></div>
    <div class="toolbar-btn toolbar-redo" @mousedown.prevent="toolbarAction('redo')"></div>
    <div class="toolbar-btn toolbar-bold" @mousedown.prevent="toolbarAction('bold')"></div>
    <div class="toolbar-btn toolbar-italic" @mousedown.prevent="toolbarAction('italic')"></div>
    <div
      class="toolbar-btn toolbar-underline"
      @mousedown.prevent="toolbarAction('underline')"
    ></div>
    <div
      class="toolbar-btn toolbar-strikeThrough"
      @mousedown.prevent="toolbarAction('strikeThrough')"
    ></div>
    <div
      class="toolbar-btn toolbar-superscript"
      @mousedown.prevent="toolbarAction('superscript')"
    ></div>
    <div
      class="toolbar-btn toolbar-subscript"
      @mousedown.prevent="toolbarAction('subscript')"
    ></div>
    <div class="toolbar-btn toolbar-clear" @mousedown.prevent="toolbarAction('clear')"></div>
    <div class="toolbar-btn toolbar-resize" @mousedown.prevent="updateCurrentDropdown('resize')">
      <div class="font-sizes toolbox" v-if="currentDropdown === 'resize'">
        <div v-for="i in 7" :key="i" @mousedown.prevent.stop="emit('resizeText', i.toString())">
          {{ i }}
        </div>
      </div>
    </div>
    <div
      class="toolbar-btn toolbar-textcolor"
      @mousedown.prevent="updateCurrentDropdown('textcolor')"
    >
      <ColorPicker
        class="toolbox"
        @select="emit('textColor', $event)"
        v-if="currentDropdown === 'textcolor'"
      />
    </div>
    <div
      class="toolbar-btn toolbar-backgroundcolor"
      @mousedown.prevent="updateCurrentDropdown('backgroundcolor')"
    >
      <ColorPicker
        class="toolbox"
        @select="emit('backgroundColor', $event)"
        v-if="currentDropdown === 'backgroundcolor'"
      />
    </div>
  </div>
</template>

<style scoped>
  .toolbar {
    position: sticky;
    left: 0;
    bottom: 0;
    margin-bottom: -33px;
    display: inline-flex;
    width: fit-content;
  }
  .toolbar-btn {
    position: relative;
  }
  .toolbox {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
</style>
