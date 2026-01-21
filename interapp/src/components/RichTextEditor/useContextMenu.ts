import { reactive, computed, nextTick, Ref } from 'vue';

export function useContextMenu(contextRef: Ref<HTMLElement | null>) {
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
  function contextCut() {
    document.execCommand('cut');
  }
  function contextCopy() {
    document.execCommand('copy');
  }
  return {
    context,
    contextStyle,
    openContext,
    hideContext,
    contextCut,
    contextCopy,
  };
}
