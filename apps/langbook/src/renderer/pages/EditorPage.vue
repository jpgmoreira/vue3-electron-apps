<script lang="ts" setup>
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();
  function onClick() {
    router.back();
  }
</script>

<template>
  <div>
    <RichTextEditor />
    <button type="button" class="btn-primary" @click="onClick">Go back</button>
  </div>
</template>
