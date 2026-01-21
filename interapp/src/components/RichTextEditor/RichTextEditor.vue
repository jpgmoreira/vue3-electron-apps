<script lang="ts" setup>
  /**
   * Here in this component I used the amazing strategy of separating the domains into composables.
   * I should have had this idea much earlier in this project.
   */
  import { useTemplateRef, onMounted } from 'vue';
  import { useContextMenu } from './useContextMenu';
  import { usePaste } from './usePaste';
  import { useDrop } from './useDrop';

  const props = defineProps({
    initial: {
      type: String,
      default: '',
      required: false,
    },
  });

  const contextRef = useTemplateRef('context-menu');
  const editorRef = useTemplateRef('editor');

  const { context, hideContext, contextStyle, contextCut, contextCopy, openContext } =
    useContextMenu(contextRef);
  const { manualPaste, contextPaste, addClassToSpans } = usePaste(editorRef);
  const { drop } = useDrop();

  /**
   * Refreshes content based on the "initial" prop.
   */
  function refresh() {
    if (!editorRef.value) throw new Error('Editor not set!');
    editorRef.value.innerHTML = props.initial;
  }

  onMounted(() => {
    document.execCommand('styleWithCSS');
    refresh();
  });
</script>

<template>
  <div class="rte" @click="hideContext" @wheel="hideContext">
    <div v-if="context.visible" ref="context-menu" :style="contextStyle" class="context-menu">
      <div @click="contextCut">Cut</div>
      <div @click="contextCopy">Copy</div>
      <div @click="contextPaste">Paste</div>
    </div>
    <div
      ref="editor"
      class="editor"
      spellcheck="false"
      contenteditable="true"
      @mousedown.right.prevent="openContext"
      @paste="manualPaste"
      @drop="drop"
      @copy="addClassToSpans"
      @cut="addClassToSpans"
    ></div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
  }
  :deep(.editor img) {
    display: inline-block;
  }
  :deep(.editor span) {
    color: inherit;
  }
</style>
