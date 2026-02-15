<script lang="ts" setup>
  import { ref, useTemplateRef, watch } from 'vue';
  import { getEmptyNote, Note, NoteFrequency } from '@common/schemas/notes';
  import { FocusIcon } from 'lucide-vue-next';
  import { cloneDeep } from '@interapp/utils/utils';
  import MdEditor from '@renderer/components/MdEditor/MdEditor.vue';
  import SelectionList from '@interapp/components/SelectionList.vue';
  import { FREQUENCY_OPTIONS } from '@renderer/helpers/options';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useStatisticsStore } from '@renderer/store/statistics';
  import { useNotesStore } from '@renderer/store/notes';

  const props = defineProps<{
    note: Note | null;
    reveal: boolean;
    isEditing: boolean;
  }>();

  const editorRef = useTemplateRef('editor-ref');

  const statisticsStore = useStatisticsStore();
  const notesStore = useNotesStore();

  const focus = ref(false);

  const localNote = ref<Note>(getEmptyNote('', 0));

  function toggleFocus() {
    focus.value = !focus.value;
  }

  function updateNoteBody(value: string) {
    localNote.value.body = value;
  }

  async function updateBucket() {
    await updateNote();
    statisticsStore.refetch();
  }

  async function changeFrequency(frequency: NoteFrequency) {
    localNote.value.frequency = frequency;
    await updateNote();
    await statisticsStore.refetch();
  }

  async function updateNote() {
    const clone = cloneDeep(localNote.value);
    await window.api.invoke(InvokeChannels.updateNote, clone);
    await window.api.invoke(InvokeChannels.recomputeQueues);
    await notesStore.refetchNote(clone.id);
  }

  function reset() {
    if (!props.note) throw new Error('Invalid prop note!');
    localNote.value.head = props.note.head;
    localNote.value.body = props.note.body;
    editorRef.value?.reset();
  }

  defineExpose({
    reset,
  });

  watch(
    () => props.note,
    (newValue: Note | null) => {
      if (newValue) {
        localNote.value = cloneDeep(newValue);
      }
      focus.value = false;
    },
    { deep: true, immediate: true }
  );
  watch(
    () => props.reveal,
    () => (focus.value = false)
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
        ref="editor-ref"
        class="grow"
        :initial="localNote.body"
        placeholder="BODY"
        @toggle-focus-mode="toggleFocus"
        @on-change="updateNoteBody"
      />
    </div>

    <!-- META -->
    <div v-if="reveal && !focus" class="flex justify-evenly">
      <div class="flex items-center gap-1">
        <span>Frequency:</span>
        <SelectionList
          class="small"
          :options="[...FREQUENCY_OPTIONS]"
          :selected="[localNote.frequency]"
          @toggle="changeFrequency"
        />
      </div>
      <div class="flex items-center gap-1">
        <label for="bucket-input">Review bucket:</label>
        <input
          id="bucket-input"
          name="bucket-input"
          type="checkbox"
          v-model="localNote.bucket"
          @change="updateBucket"
        />
      </div>
    </div>
  </div>
</template>
