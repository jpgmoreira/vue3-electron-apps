<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { getEmptyNote, Note } from '@common/schemas/notes';
  import { FocusIcon } from 'lucide-vue-next';
  import { cloneDeep } from '@interapp/utils/utils';
  import MdEditor from '@renderer/components/MdEditor/MdEditor.vue';

  const props = defineProps<{
    note: Note;
    reveal: boolean;
    isEditing: boolean;
  }>();

  const focus = ref(false);

  const localNote = ref<Note>(getEmptyNote('', 0));

  function toggleFocus() {
    focus.value = !focus.value;
  }

  function updateNoteBody(value: string) {
    localNote.value.body = value;
  }

  watch(
    () => props.note,
    (newValue: Note) => {
      localNote.value = cloneDeep(newValue);
    },
    { deep: true, immediate: true }
  );
</script>

<template>
  <div class="flashcard flex flex-col absolute inset-0 overflow-y-auto">
    <!-- TOP -->
    <div class="top flex justify-between items-end">
      <div class="opacity-50">{{ localNote.name }}</div>
      <FocusIcon v-if="reveal" class="focus-icon" @click="toggleFocus" />
    </div>

    <!-- HEAD -->
    <div v-if="!focus" class="head flex justify-center">
      <textarea
        :readonly="!isEditing"
        spellcheck="false"
        v-model="localNote.head"
        placeholder="HEAD"
      ></textarea>
    </div>

    <!-- BODY -->
    <div class="body grow flex flex-col" v-if="reveal">
      <MdEditor
        class="grow"
        :initial="localNote.body"
        placeholder="BODY"
        @toggle-focus-mode="toggleFocus"
        @on-change="updateNoteBody"
      />
    </div>
  </div>
</template>
