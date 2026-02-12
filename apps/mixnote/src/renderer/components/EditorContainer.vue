<script lang="ts" setup>
  import { ref, useTemplateRef } from 'vue';
  import { Note } from '@common/schemas/notes';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import MdEditor from './MdEditor/MdEditor.vue';
  import { useNotesStore } from '@renderer/store/notes';
  const props = defineProps<{ note: Note }>();
  const notesStore = useNotesStore();
  const focus = ref(false);
  const headRef = useTemplateRef('head-ref');
  function toggleFocus() {
    focus.value = !focus.value;
  }
  function updateNoteHead() {
    if (!headRef.value) throw new Error('Invalid head ref!');
    const content = headRef.value.value;
    notesStore.updateCachedNoteHead(props.note.id, content);
  }
  function updateNoteBody(value: string) {
    notesStore.updateCachedNoteBody(props.note.id, value);
  }
</script>

<template>
  <div class="editor-container h-full relative overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col absolute top-0 left-0 w-full min-h-full">
      <div v-if="!focus" class="p-1 flex flex-col note-info">
        <div class="flex flex-wrap">
          <div class="min-w-0 w-1/2 overflow-hidden">
            <div class="whitespace-nowrap truncate">
              <b>Title:</b>
              {{ props.note.name }}
            </div>
          </div>
          <div class="min-w-0 overflow-hidden">
            <div class="flex gap-1 items-center whitespace-nowrap truncate">
              <b>Review bucket:</b>
              <input type="checkbox" :checked="props.note.bucket" />
            </div>
          </div>
        </div>
        <div class="flex flex-wrap">
          <div class="min-w-0 w-1/2 overflow-hidden">
            <div class="whitespace-nowrap truncate">
              <b>Created at:</b>
              {{ parseTimestamp(props.note.createdAt) }}
            </div>
          </div>
          <div class="min-w-0 overflow-hidden">
            <div class="whitespace-nowrap truncate">
              <b>Last modified:</b>
              {{ parseTimestamp(props.note.lastModified) }}
            </div>
          </div>
        </div>
      </div>
      <textarea
        v-if="!focus"
        ref="head-ref"
        class="head-textarea"
        placeholder="HEAD"
        spellcheck="false"
        :value="props.note.head"
        @input="updateNoteHead"
      ></textarea>
      <MdEditor
        class="grow"
        :initial="props.note.body"
        @toggle-focus-mode="toggleFocus"
        @on-change="updateNoteBody"
        placeholder="BODY"
      />
    </div>
  </div>
</template>

<style scoped>
  .head-textarea {
    padding: 3px 5px;
    field-sizing: content;
    resize: none;
    font-size: 14px;
  }
  .note-info {
    font-size: 14px;
  }
</style>
