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

  // --- Props: ---

  const props = defineProps({
    initial: {
      type: String,
      default: '',
      required: false,
    },
  });

  // --- Variables: ---

  const rteRef = useTemplateRef('rte');
  const isCtxVisible = ref(false);
  const ctxStyle = reactive({
    left: '',
    right: '',
    top: '',
    bottom: '',
  });

  const isToolbarVisible = ref(false);

  // Class to identify spans that were styled inside of this component:
  const styledSpanClass = 'xrte';

  // Current image selected for resizing:
  const selectedImageClass = 'selected-image';

  const allowedSpanStyles = Object.freeze([
    'font-weight',
    'font-style',
    'font-size',
    'text-decoration',
    'text-decoration-line',
    'color',
    'background-color',
    'vertical-align',
  ]);

  // --- Functions: ---

  function focus() {
    isToolbarVisible.value = true;
    rteRef.value?.focus();
  }

  function refresh() {
    if (!rteRef.value) return;
    rteRef.value.innerHTML = props.initial;
  }

  function blur() {
    isToolbarVisible.value = false;
    isCtxVisible.value = false;
    emit('blur');
    clearSelectedImage();
  }

  // written by ChatGTP and tested.
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

  function openCtx(e: MouseEvent) {
    const rte = rteRef.value;
    if (!rte) return;
    const rect = rte.getBoundingClientRect();
    const rl = rect.left,
      rr = rect.right,
      rt = rect.top,
      rb = rect.bottom,
      cx = e.clientX,
      cy = e.clientY;
    const ctxWidth = 100,
      ctxHeight = 100;
    Object.assign(ctxStyle, {
      left: '',
      right: '',
      top: '',
      bottom: '',
    });
    if (rb - cy < ctxHeight) {
      ctxStyle.bottom = rb - cy + 'px';
    } else {
      ctxStyle.top = cy - rt + 'px';
    }
    if (rr - cx < ctxWidth) {
      ctxStyle.right = rr - cx + 'px';
    } else {
      ctxStyle.left = cx - rl + 'px';
    }
    isCtxVisible.value = true;
  }

  // --- Context menu interactions: ---

  function contextMenuCopy() {
    document.execCommand('copy');
    isCtxVisible.value = false;
  }

  async function contextMenuPaste() {
    isCtxVisible.value = false;
    try {
      const clipboardItems = await navigator.clipboard.read();
      const dataTransfer = new DataTransfer();
      let html = '';
      let plainText = '';
      for (const item of clipboardItems) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          // 1. If it is an image:
          if (type.startsWith('image/')) {
            const file = new File([blob], 'pasted-image', { type });
            dataTransfer.items.add(file);
            continue;
          }
          // 2. If it is HTML:
          if (type === 'text/html') {
            html = await blob.text();
            dataTransfer.setData('text/html', html);
            continue;
          }
          // 3. If it is plain text:
          if (type === 'text/plain') {
            plainText = await blob.text();
            dataTransfer.setData('text/plain', plainText);
            continue;
          }
        }
      }
      // Fallback for plain text:
      if (!plainText) {
        const txt = await navigator.clipboard.readText();
        if (txt) dataTransfer.setData('text/plain', txt);
      }
      handlePaste(dataTransfer);
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  }

  function contextMenuCut() {
    document.execCommand('cut');
    isCtxVisible.value = false;
  }

  // --- Drop: ---

  function drop(e: DragEvent) {
    // Due to some problems and difficulties related to drop events in JavaScript, the only thing you are allowed to drop
    //   in a card's field are image files from your operating system.
    e.preventDefault();
    if (!e.dataTransfer) return;
    for (const item of e.dataTransfer.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        console.log('-> drop an image from the operating system.');
        const reader = new FileReader();
        reader.onload = (fileEvent) => {
          focus();
          const result = fileEvent.target?.result;
          if (typeof result !== 'string') return;
          document.execCommand('insertImage', false, result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // --- Paste: ---

  function paste(e: ClipboardEvent) {
    e.preventDefault();
    const data = e.clipboardData;
    if (!data) return;
    handlePaste(data);
  }

  function handlePaste(data: DataTransfer) {
    // 1. Check if pasting an image from the clipboard:
    const items = data.items;
    if (items && items.length && items[0].kind === 'file' && items[0].type.startsWith('image/')) {
      const file = items[0].getAsFile();
      if (!file) return;
      console.log('-> paste an image from the clipboard.');
      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        const result = fileEvent.target?.result;
        if (typeof result !== 'string') return;
        document.execCommand('insertImage', false, result);
      };
      reader.readAsDataURL(file);
      return;
    }
    // 2. Check if pasting HTML content.
    // FIX: Allow pasting of content that comes from inside the RTE, including styles and images.
    const html = data.getData('text/html').trim();
    if (html) {
      console.log('-> paste as html');
      const cleaned = cleanPastedHTML(html);
      setTimeout(() => {
        document.execCommand('insertHTML', false, cleaned);
      }, 0);
      return;
    }
    // 3. Paste as plaintext:
    const text = data.getData('text/plain').trim();
    if (text) {
      console.log('-> paste as plaintext');
      setTimeout(() => {
        document.execCommand('insertText', false, text);
      }, 0);
    }
  }

  function cleanPastedHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
  }

  function cleanSpanStyle(el: HTMLSpanElement) {
    const style = el.getAttribute('style');
    if (style) {
      const styleMap = style
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      const filtered = styleMap.filter((s) => {
        const prop = s.split(':')[0].trim();
        return allowedSpanStyles.includes(prop);
      });
      if (filtered.length > 0) {
        el.setAttribute('style', filtered.join('; ') + ';');
      } else {
        el.removeAttribute('style');
      }
    }
  }

  function sanitizeNode(node: Node) {
    const allowedAttributes = ['src', 'class', 'width'];
    const allowedClasses = [styledSpanClass];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      for (const attr of el.attributes) {
        const name = attr.name.toLowerCase();
        // Allow pasting only allowed styles for spans.
        if (name === 'style' && el.tagName === 'SPAN' && el.classList.contains(styledSpanClass)) {
          cleanSpanStyle(el);
          continue;
        }
        if (!allowedAttributes.includes(name)) {
          el.removeAttribute(name);
        }
      }
      if (el.hasAttribute('class')) {
        const finalClasses = el.classList.value
          .split(/\s+/)
          .filter((cls) => allowedClasses.includes(cls));
        if (finalClasses.length > 0) {
          el.className = finalClasses.join(' ');
        } else {
          el.removeAttribute('class');
        }
      }
      if (el.tagName === 'IMG') {
        try {
          const url = new URL((el as HTMLImageElement).src);
          if (url.protocol.startsWith('http')) {
            el.remove();
            return;
          }
        } catch {
          el.remove();
          return;
        }
      }
    }
    node.childNodes.forEach(sanitizeNode);
  }

  // --- Add identifier class to all spans before cut and copy: ---

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

  // -- Lifecycle hooks: ---

  onMounted(() => {
    document.execCommand('styleWithCSS');
  });
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
      v-html="props.initial"
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
  :deep(.rte img) {
    display: inline-block;
  }
  :deep(.rte span) {
    color: inherit;
  }
  .context-menu {
    position: absolute;
  }
</style>
