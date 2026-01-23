<script lang="ts" setup>
  import { ref, useTemplateRef } from 'vue';
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import ColorPicker from '@interapp/components/RichTextEditor/ColorPicker/ColorPicker.vue';
  import Toolbar from '@interapp/components/RichTextEditor/Toolbar/Toolbar.vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();
  const editor = useTemplateRef('editor');
  const content = ref('');
  function onClick() {
    router.back();
  }
  function updateContent() {
    if (!editor.value) throw new Error('No editor!');
    content.value = editor.value.getContent();
  }
</script>

<template>
  <div>
    <RichTextEditor ref="editor" />
    <button type="button" class="btn-primary mr-1" @click="onClick">Go back</button>
    <button type="button" class="btn-primary" @click="updateContent">Update content</button>
    <div>
      <ColorPicker />
      <Toolbar />
    </div>
    <div style="border: 1px solid red" v-html="content"></div>
  </div>
</template>
