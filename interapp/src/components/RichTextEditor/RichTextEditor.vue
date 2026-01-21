<script lang="ts" setup>
  import { reactive, computed, useTemplateRef, nextTick } from 'vue';
  const contextRef = useTemplateRef('context-menu');
  const context = reactive({
    visible: false,
    top: 0,
    left: 0,
  });
  const contextStyle = computed(() => ({
    top: `${context.top}px`,
    left: `${context.left}px`,
  }));
  function openContext(e: MouseEvent) {
    context.visible = true;
    nextTick(() => {
      const ctx = contextRef.value;
      if (!ctx) throw new Error('Context menu not set!');
      const box = ctx.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      context.top = Math.min(e.clientY, winHeight - box.height);
      context.left = Math.min(e.clientX, winWidth - box.width);
    });
  }
  function hideContext() {
    context.visible = false;
  }
</script>

<template>
  <div class="rte" @click="hideContext" @wheel="hideContext">
    <div v-if="context.visible" ref="context-menu" :style="contextStyle" class="context-menu">
      <div>Cut</div>
      <div>Copy</div>
      <div>Paste</div>
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
