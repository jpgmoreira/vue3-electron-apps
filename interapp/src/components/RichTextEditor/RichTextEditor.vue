<script lang="ts" setup>
  /**
   * Here in this component I used the amazing strategy of separating the domains into composables.
   * I should have had this idea much earlier in this project.
   */
  import { useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
  import { useContextMenu } from './useContextMenu';
  import { usePaste } from './usePaste';
  import { useDrop } from './useDrop';
  import { useEvents } from './useEvents';
  import { useKeyDown } from './useKeyDown';
  import { useGetContent } from './useGetContent';
  import Toolbar from './Toolbar/Toolbar.vue';

  const props = defineProps({
    initial: {
      type: String,
      default: '',
      required: false,
    },
  });

  const emit = defineEmits<{
    (e: 'input'): void;
    (e: 'blur'): void;
  }>();

  const contextRef = useTemplateRef('context-menu');
  const editorRef = useTemplateRef('editor');
  const rteRef = useTemplateRef('rte');

  const { context, contextStyle, hideContext, contextCut, contextCopy, openContext } =
    useContextMenu(contextRef);
  const { manualPaste, contextPaste, addClassToSpans } = usePaste(editorRef);
  const { click, wheel, clearSelectedImage } = useEvents(editorRef);
  const { getContent } = useGetContent(editorRef);
  const { keydown } = useKeyDown();
  const { drop } = useDrop();

  /**
   * Refreshes content based on the "initial" prop.
   */
  function refresh() {
    if (!editorRef.value) throw new Error('Editor not set!');
    editorRef.value.innerHTML = props.initial;
  }

  function focus() {
    const el = editorRef.value;
    if (!el) throw new Error('RTE ref not defined!');
    el.focus();
    document.execCommand('selectAll', false, undefined);
    document.getSelection()?.collapseToEnd();
  }

  function blur() {
    clearSelectedImage();
    hideContext();
    emit('blur');
  }

  function windowMouseDown(e: MouseEvent) {
    if (!rteRef.value) throw new Error('RTE not set!');
    if (!rteRef.value.contains(e.target as Node)) {
      blur();
    }
  }

  defineExpose({
    refresh, // Refreshes content based on the "initial" prop.
    getContent,
    focus,
    drop,
  });

  onMounted(() => {
    document.execCommand('styleWithCSS');
    window.addEventListener('mousedown', windowMouseDown);
    window.addEventListener('blur', blur);
    refresh();
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', windowMouseDown);
    window.removeEventListener('blur', blur);
  });
</script>

<template>
  <div class="rte" ref="rte" @click="hideContext" @wheel="hideContext">
    <div
      v-if="context.visible"
      ref="context-menu"
      :style="contextStyle"
      class="custom-context-menu"
    >
      <div class="item" @click="contextCut">Cut</div>
      <div class="item" @click="contextCopy">Copy</div>
      <div class="item" @click="contextPaste">Paste</div>
    </div>
    <div
      ref="editor"
      class="editor"
      spellcheck="false"
      contenteditable="true"
      @mousedown.right.prevent="openContext"
      @paste="manualPaste"
      @drop="
        focus();
        drop($event);
      "
      @copy="addClassToSpans"
      @cut="addClassToSpans"
      @click="click"
      @wheel="wheel"
      @keydown="keydown"
      @input="emit('input')"
    ></div>
    <div class="toolbar-container">
      <Toolbar />
    </div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
  }
  .editor :deep(img) {
    display: inline-block;
  }
  .editor :deep(span) {
    color: inherit;
  }
</style>
