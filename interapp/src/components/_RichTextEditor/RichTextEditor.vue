<script lang="ts" setup>
  import { ref, reactive, useTemplateRef, onMounted } from 'vue';
  import DOMPurify from 'dompurify';
  import Toolbar from './Toolbar.vue';

  // --- Exposes: ---

  defineExpose({
    focus,
    getContent,
    refresh, // Refreshes content based on the "initial" prop.
    drop,
  });

  // --- Emits: ---

  const emit = defineEmits<{
    (e: 'blur'): void;
  }>();

  // --- Variables: ---

  const rteRef = useTemplateRef('rte');

  const isToolbarVisible = ref(false);

  // Current image selected for resizing.
  // There will be at most once with this class at a time.
  const selectedImageClass = 'selected-image';

  // --- Functions: ---

  function focus() {
    isToolbarVisible.value = true;
    rteRef.value?.focus();
  }

  function blur() {
    isToolbarVisible.value = false;
    isCtxVisible.value = false;
    emit('blur');
    clearSelectedImage();
  }

  /**
   * Written by ChatGPT and tested.
   * Returns a simplified version of an RTE's contents as a HTML string, by reducing
   *   the amount of HTML bloat that happens in a contenteditable element.
   */
  function normalizeLines(rte: HTMLElement): string {
    const lines: string[] = [];
    let currentLine: string[] = [];
    const pushCurrentLineIfAny = () => {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(''));
        currentLine = [];
      }
    };
    rte.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'DIV') {
          // Before processing the DIV, flush the current line
          pushCurrentLineIfAny();
          // Check if the DIV is "empty" (only spaces / &nbsp; / <br>)
          const divInner = el.innerHTML ?? '';
          const divText = el.textContent ?? '';
          const isEmptyDiv =
            divText.trim() === '' &&
            // If there are tags, ensure they are only <br> or &nbsp;
            // remove comments/spaces and check if innerHTML contains anything "visible"
            divInner.replace(/<!--[\s\S]*?-->/g, '').replace(/(\s|&nbsp;|<br\/?>)*/gi, '') === '';
          if (isEmptyDiv) {
            // Empty line
            lines.push('');
          } else {
            // DIV with content -> use the div's innerHTML as a line
            lines.push(divInner);
          }
        } else {
          // Inline elements (img, span, b, etc.) stay in the current line
          // use outerHTML to preserve attributes
          currentLine.push(el.outerHTML);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Preserve text as-is; do not trim here to avoid losing meaningful spaces
        const txt = node.textContent ?? '';
        // Avoid pushing purely empty \n\r nodes; keep significant text
        if (txt !== null && txt !== '') currentLine.push(txt);
      }
      // Ignore comments and other node types
    });
    // If there's inline content after the last DIV, flush it
    pushCurrentLineIfAny();
    // Join the lines with <br> between them.
    // IMPORTANT: do not use join('') — we want to keep line breaks.
    let content = lines.join('<br>');
    // Safe trim on the edges: remove br/nbsp/whitespace only at start and end
    content = content
      .replace(/^(?:\s|&nbsp;|(?:<br\s*\/?>))+/, '')
      .replace(/(?:\s|&nbsp;|(?:<br\s*\/?>))+$/, '')
      .trim();
    return content;
  }

  function linkifyText(html: string): string {
    const urlRegex = new RegExp(
      '(?:https?:\\/\\/|ftp:\\/\\/|www\\.)' + // protocol (http, https, ftp) or "www."
        '(?:' +
        '(?:localhost)' + // match "localhost"
        '|' +
        '(?:\\d{1,3}(?:\\.\\d{1,3}){3})' + // match IPv4 addresses
        '|' +
        '(?:[\\p{L}0-9.-]+\\.[\\p{L}]{2,})' + // match domain names with TLD (Unicode supported)
        ')' +
        '(?::\\d+)?' + // optional port number
        '(?:[^\\s<]*)', // match the rest of the URL (path, query, fragment) until whitespace or "<"
      'giu'
    );
    return html.replace(urlRegex, (match) => {
      return `<a href="#">${match}</a>`;
    });
  }

  function getContent() {
    if (!rteRef.value) return '';
    // Create a clone for precaution, even though the HTML content is not modified directly.
    const clone = rteRef.value.cloneNode(true) as HTMLElement;
    let content = normalizeLines(clone);
    content = linkifyText(content);
    content = DOMPurify.sanitize(content);
    return content;
  }

  function clearSelectedImage() {
    if (!rteRef.value) return;
    const si = [...rteRef.value.querySelectorAll(`.${selectedImageClass}`)];
    si.forEach((element) => element.classList.remove(selectedImageClass));
  }

  // --- Add identifier class to all spans before cut and copy: ---

  /**
   * This class is to identify spans that came from inside of the RTE
   * when you paste content.
   */
  function addClassToSpans() {
    if (!rteRef.value) return;
    const allSpans = rteRef.value.querySelectorAll('span');
    allSpans.forEach((span) => {
      span.classList.add(styledSpanClass);
    });
  }

  // --- Other user events: ---

  function keydown(e: KeyboardEvent) {
    // Allowed keyboard hotkeys:
    // - CTRL + c: Copy.
    // - CTRL + v: Paste.
    // - CTRL + x: Cut.
    // - CTRL + z: Undo.
    // - CTRL + y: Redo.
    // - CTRL + b: Toggle bold.
    // - CTRL + i: Toggle italic.
    // - CTRL + u: Toggle underline.
    // - CTRL + a: Select all.
    // - CTRL + s: Toggle strikethrough.
    // - CTRL + <arrow_keys>: Jump whole words.
    // - CTRL + SHIFT + <arrow_keys>: Jump whole words selecting.
    // - CTRL + SHIFT + v: Paste as plaintext.
    const key = e.key.toLowerCase();
    if (e.ctrlKey) {
      switch (key) {
        case 'c':
        case 'v':
        case 'z':
        case 'y':
        case 'b':
        case 'i':
        case 'u':
        case 'a':
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          break;
        case 's':
          document.execCommand('strikeThrough');
          break;
        case 'x':
          document.execCommand('cut');
          break;
        default:
          e.preventDefault();
      }
    } else {
      if (key === 'tab') {
        e.preventDefault();
        document.execCommand('insertHtml', false, '&nbsp;'.repeat(8));
      } else if (key === ' ') {
        e.preventDefault();
        document.execCommand('insertHtml', false, '&nbsp;');
      }
    }
  }

  function click(e: MouseEvent) {
    if (!rteRef.value) return;
    const element = e.target as HTMLElement;
    const si = [...rteRef.value.querySelectorAll(`.${selectedImageClass}`)];
    clearSelectedImage();
    if (element.tagName === 'IMG' && !si.includes(element)) {
      element.classList.add(selectedImageClass);
    }
  }

  function wheel(e: WheelEvent) {
    isCtxVisible.value = false;
    const el = e.target as HTMLElement;
    if (el.tagName === 'IMG' && el.classList.contains(selectedImageClass)) {
      e.preventDefault();
      const img = el as HTMLImageElement;
      const factor = e.ctrlKey ? 60 : 6;
      let scale = img.width ? Math.max(img.width / factor, 3) : 3;
      if (e.deltaY > 0) scale *= -1;
      img.width += scale;
    }
  }

  // -- Toolbar events: ---

  function undo() {
    document.execCommand('undo');
  }

  function redo() {
    document.execCommand('redo');
  }
  function bold() {
    document.execCommand('bold');
  }

  function italic() {
    document.execCommand('italic');
  }

  function underline() {
    document.execCommand('underline');
  }

  function strikeThrough() {
    document.execCommand('strikeThrough');
  }

  function superscript() {
    document.execCommand('superscript');
  }

  function subscript() {
    document.execCommand('subscript');
  }

  function resizeText(size: string) {
    document.execCommand('fontSize', false, size);
  }

  function clear() {
    const selection = window.getSelection();
    if (selection?.type === 'Caret') {
      // the current selection is collapsed.
      document.execCommand('insertText', false, ' ');
      selection.modify('extend', 'left', 'character');
    }
    // trick to remove subscript and superscript.
    document.execCommand('superscript');
    document.execCommand('subscript');
    document.execCommand('subscript');
    // necessary to call twice because of a bug with clearing the text background color.
    document.execCommand('removeFormat');
    document.execCommand('removeFormat');
  }

  function changeTextColor(color: string) {
    document.execCommand('foreColor', false, color);
  }

  function changeBackgroundColor(color: string) {
    document.execCommand('backColor', false, color);
  }
</script>

<template>
  <div class="rte-root">
    <div v-if="isCtxVisible" :style="ctxStyle" class="context-menu">
      <div @mousedown.prevent="contextMenuCut">Cut</div>
      <div @mousedown.prevent="contextMenuCopy">Copy</div>
      <div @mousedown.prevent="contextMenuPaste">Paste</div>
    </div>
    <div
      ref="rte"
      class="rte"
      spellcheck="false"
      contenteditable="true"
      @focus="focus"
      @blur="blur"
      @click="click"
      @copy="addClassToSpans"
      @cut="addClassToSpans"
      @keydown="keydown"
      @mousedown.right.prevent="openCtx"
      @mousedown.left="isCtxVisible = false"
      @wheel="wheel"
      @paste="paste"
      @drop="drop"
    ></div>
    <Toolbar
      v-if="isToolbarVisible"
      @undo="undo"
      @redo="redo"
      @bold="bold"
      @italic="italic"
      @underline="underline"
      @strike-through="strikeThrough"
      @resize-text="resizeText"
      @superscript="superscript"
      @subscript="subscript"
      @clear="clear"
      @text-color="changeTextColor"
      @background-color="changeBackgroundColor"
    />
  </div>
</template>

<style scoped>
  .rte-root {
    max-width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .rte {
    flex-grow: 1;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: normal;
    word-break: normal;
  }
</style>
