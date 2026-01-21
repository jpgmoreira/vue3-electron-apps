<script lang="ts" setup>
  import { useTemplateRef } from 'vue';
  import { useContextMenu } from './useContextMenu';
  const contextRef = useTemplateRef('context-menu');
  const { context, hideContext, contextStyle, contextCut, contextCopy, contextPaste, openContext } =
    useContextMenu(contextRef);
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
    ></div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
  }
</style>
