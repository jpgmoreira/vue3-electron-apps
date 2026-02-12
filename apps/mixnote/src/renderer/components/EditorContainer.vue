<script lang="ts" setup>
  import { ref, useTemplateRef, watch } from 'vue';
  import { Note } from '@common/schemas/notes';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import MdEditor from './MdEditor/MdEditor.vue';
  import { cloneDeep } from '@interapp/utils/utils';
  const props = defineProps<{ note: Note }>();
  const bodyRef = useTemplateRef('body-ref');
  const headContent = ref(props.note.head);
  const focus = ref(false);
  function toggleFocus() {
    focus.value = !focus.value;
  }
  function noteChange() {
    const clone = cloneDeep(props.note); // Do not mutate props.
    clone.head = headContent.value;
    clone.body = bodyRef.value!.getContent();
    // notesStore.updateNote(clone);
  }
  watch(
    () => props.note.id,
    () => {
      headContent.value = props.note.head;
      bodyRef.value?.resetContent();
    }
  );
  watch(
    // Body is already watched inside of Editor.
    () => props.note.head,
    () => {
      headContent.value = props.note.head;
    }
  );
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
        class="head-textarea"
        placeholder="HEAD"
        spellcheck="false"
        v-model="headContent"
        @input="noteChange"
      ></textarea>
      <MdEditor
        class="grow"
        ref="body-ref"
        :initial="props.note.body"
        @input="noteChange"
        @toggle-focus-mode="toggleFocus"
        placeholder="BODY"
      />
    </div>
  </div>
</template>
