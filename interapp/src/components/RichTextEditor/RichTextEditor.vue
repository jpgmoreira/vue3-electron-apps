<script lang="ts" setup>
  /**
   * Here in this component I used the amazing strategy of separating the domains into composables.
   * I should have had this idea much earlier in this project.
   */
  import { useTemplateRef } from 'vue';
  import { useContextMenu } from './useContextMenu';
  import { usePaste } from './usePaste';
  const contextRef = useTemplateRef('context-menu');
  const { context, hideContext, contextStyle, contextCut, contextCopy, openContext } =
    useContextMenu(contextRef);
  const { manualPaste, contextPaste } = usePaste();
</script>

<template>
  <div class="rte" @click="hideContext" @wheel="hideContext">
    <div v-if="context.visible" ref="context-menu" :style="contextStyle" class="context-menu">
      <div @click="contextCut">Cut</div>
      <div @click="contextCopy">Copy</div>
      <div @click="contextPaste">Paste</div>
    </div>
    <div
      class="editor"
      spellcheck="false"
      contenteditable="true"
      @mousedown.right.prevent="openContext"
      @paste="manualPaste"
    ></div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
  }
</style>
