<script lang="ts" setup>
  import { ref, useTemplateRef, nextTick, computed } from 'vue';
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useRouter } from 'vue-router';
  import { cloneDeep, randomId } from '@interapp/utils/utils';
  import { Card, getEmptyCard } from '@common/schemas/card';
  type RTEField = 'front' | 'back' | 'extra';
  const router = useRouter();
  const editorStore = useEditorStore();
  const card = ref<Card>(getEmptyCard(randomId()));
  if (editorStore.card) card.value = cloneDeep(editorStore.card);
  const rteRefs = ref({
    front: useTemplateRef('front'),
    back: useTemplateRef('back'),
    extra: useTemplateRef('extra'),
  });
  const rteFocus = ref({
    front: false,
    back: false,
    extra: false,
  });
  const rteShow = computed(() => ({
    front: card.value.front || rteFocus.value.front,
    back: card.value.back || rteFocus.value.back,
    extra: card.value.extra || rteFocus.value.extra,
  }));
  function rteInput(field: RTEField) {
    const ref = rteRefs.value[field];
    if (!ref) throw new Error('Invalid RTE ref!');
    const content = ref.getContent();
    card.value[field] = content;
    rteFocus.value[field] = true;
  }
  function clearFocus() {
    rteFocus.value.front = false;
    rteFocus.value.back = false;
    rteFocus.value.extra = false;
  }
  function setRteFocus(field: RTEField) {
    clearFocus();
    rteFocus.value[field] = true;
    nextTick(() => {
      rteRefs.value[field]?.focus();
    });
  }

  function cancel() {
    router.back();
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 p-1">
    <RichTextEditor
      ref="front"
      v-if="rteShow.front"
      :initial="card.front"
      @input="rteInput('front')"
      @blur="rteFocus.front = false"
    />
    <div v-else class="rte-placeholder" @mousedown.prevent="setRteFocus('front')">FRONT</div>
    <RichTextEditor
      ref="back"
      v-if="rteShow.back"
      :initial="card.back"
      @input="rteInput('back')"
      @blur="rteFocus.back = false"
    />
    <div v-else class="rte-placeholder" @mousedown.prevent="setRteFocus('back')">BACK</div>
    <RichTextEditor
      ref="extra"
      v-if="rteShow.extra"
      :initial="card.extra"
      @input="rteInput('extra')"
      @blur="rteFocus.extra = false"
    />
    <div v-else class="rte-placeholder" @mousedown.prevent="setRteFocus('extra')">EXTRA</div>
  </div>
</template>
