<script lang="ts" setup>
  import { ref, useTemplateRef, nextTick } from 'vue';
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useRouter } from 'vue-router';
  import { cloneDeep, randomId } from '@interapp/utils/utils';
  import { Card, getEmptyCard } from '@common/schemas/card';
  type Field = 'front' | 'back' | 'extra';
  const router = useRouter();
  const editorStore = useEditorStore();
  const card = ref<Card>(getEmptyCard(randomId()));
  if (editorStore.card) card.value = cloneDeep(editorStore.card);
  const focus = ref({
    front: false,
    back: false,
    extra: false,
  });
  const rte = ref({
    front: useTemplateRef('front'),
    back: useTemplateRef('back'),
    extra: useTemplateRef('extra'),
  });
  function clearFocus() {
    focus.value.front = false;
    focus.value.back = false;
    focus.value.extra = false;
  }
  function setFocus(field: Field) {
    clearFocus();
    focus.value[field] = true;
    nextTick(() => {
      rte.value[field]?.focus();
    });
  }
  function cancel() {
    router.back();
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 p-1">
    <RichTextEditor ref="front" v-if="focus.front || card.front" :initial="card.front" />
    <div v-else class="rte-placeholder" @click="setFocus('front')">FRONT</div>
    <RichTextEditor ref="back" v-if="focus.back || card.back" :initial="card.back" />
    <div v-else class="rte-placeholder" @click="setFocus('back')">BACK</div>
    <RichTextEditor ref="extra" v-if="focus.extra || card.extra" :initial="card.extra" />
    <div v-else class="rte-placeholder" @click="setFocus('extra')">EXTRA</div>
  </div>
</template>
