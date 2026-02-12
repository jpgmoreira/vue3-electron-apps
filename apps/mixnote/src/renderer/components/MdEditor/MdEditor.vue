<script lang="ts" setup>
  import { ref, useTemplateRef } from 'vue';
  import { MdEditor, ToolbarNames, type ExposeParam } from 'md-editor-v3';
  import CustomPreview from './CustomPreview.vue';
  import ColorPicker from './ColorPicker/ColorPicker.vue';
  import Focus from './Focus.vue';

  defineExpose({
    getContent,
    resetContent,
    setPreviewOnly,
  });

  const emit = defineEmits<{
    (e: 'toggleFocusMode'): void;
  }>();

  const props = defineProps<{
    initial: string;
    placeholder?: string;
  }>();
  const content = ref(props.initial);
  const editorRef = useTemplateRef<ExposeParam>('editor-ref');

  const toolbars: ToolbarNames[] = [
    'revoke',
    'next',
    '-',
    'bold',
    'underline',
    'italic',
    'strikeThrough',
    'sub',
    'sup',
    'quote',
    0,
    '-',
    'unorderedList',
    'orderedList',
    'task',
    'table',
    'link',
    '-',
    'prettier',
    1,
    'preview',
    'previewOnly',
  ];

  // --- Paste images: ---

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function uploadImage(files: File[]) {
    files.forEach(async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const md = `<img src="${dataUrl}" />`;
      editorRef.value?.insert(() => ({ targetValue: md, select: false }));
    });
  }

  //  --- ---

  function insertColor(color: string) {
    editorRef.value?.insert(() => ({ targetValue: color, select: false }));
  }

  function getContent() {
    return content.value;
  }

  function resetContent() {
    content.value = props.initial;
  }

  function setPreviewOnly(value: boolean) {
    editorRef.value?.togglePreviewOnly(value);
  }
</script>

<template>
  <MdEditor
    class="md-editor"
    v-model="content"
    ref="editor-ref"
    language="en-US"
    theme="dark"
    @onUploadImg="uploadImage"
    noUploadImg
    noImgZoomIn
    :previewComponent="CustomPreview"
    :toolbars="toolbars"
    noMermaid
    noEcharts
    :autoFoldThreshold="Infinity"
    :placeholder="props.placeholder || ''"
  >
    <template #defToolbars>
      <ColorPicker @select="insertColor" />
      <Focus @toggle="emit('toggleFocusMode')" />
    </template>
  </MdEditor>
</template>

<style>
  /* Editor */
  .md-editor {
    border: none !important;
  }
  .md-editor .cm-content {
    font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
    font-size: 14px !important;
  }
  /* Toolbar */
  .md-editor-toolbar-wrapper {
    padding: 0 !important;
  }
  .md-editor-toolbar-left,
  .md-editor-toolbar-right {
    padding: 0 !important;
    display: flex;
    flex-wrap: wrap;
  }
  .md-editor-toolbar-item {
    padding: 3px !important;
  }
  .md-editor-icon {
    padding: 0 !important;
  }
  .md-editor-divider {
    margin: 3px !important;
  }
  /* Resizer */
  .md-editor-custom-scrollbar__track {
    display: none !important;
  }
  .md-editor-resize-operate {
    height: 100%;
    padding: 2px;
    cursor: col-resize;
    z-index: 10;
  }
  /* Code editor */
  .md-editor-code {
    margin: 15px 0 !important;
  }
  .md-editor-code-head {
    display: flex !important;
    justify-content: end !important;
  }
  .md-editor-code-flag {
    display: none !important;
  }
  .md-editor-code-lang {
    font-weight: bold !important;
    text-transform: uppercase;
    font-size: 11.5px;
  }
  .md-editor-code code {
    margin-top: -18px;
    font-size: 14.8px !important;
  }
  /* Unordered lists */
  .md-editor-preview ul {
    list-style: disc !important;
  }
  .md-editor-preview ul ul {
    list-style: circle !important;
  }
  /* Ordered lists */
  .md-editor-preview ol {
    list-style: decimal !important;
  }
  /* Tables */
  .md-editor-preview table * {
    line-height: 1rem !important;
  }
  .md-editor-preview table th {
    border-bottom: none !important;
    border-top: none !important;
  }
  /* Checkboxes */
  .md-editor-preview .task-list-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
