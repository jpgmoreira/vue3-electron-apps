<script lang="ts" setup>
  import { ref, useTemplateRef, nextTick, computed } from 'vue';
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useRouter } from 'vue-router';
  import { useToastStore } from '@interapp/store/toast';
  import { arrayRemove, cloneDeep, randomId } from '@interapp/utils/utils';
  import { Card, CardFrequency, getEmptyCard } from '@common/schemas/card';
  import MediaInput from '@interapp/components/MediaInput/renderer/MediaInput.vue';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useTagsStore } from '@renderer/store/tags';
  import { MultiselectOption } from '@interapp/components/Multiselect.vue';
  import { TagsMap } from '@common/schemas/tags';
  import Multiselect from '@interapp/components/Multiselect.vue';
  import { useSessionsStore } from '@renderer/store/sessions';
  import SelectionList from '@interapp/components/SelectionList.vue';
  import { FREQUENCY_OPTIONS } from '@renderer/helpers/options';

  type RTEField = 'front' | 'back' | 'extra';
  const router = useRouter();
  const editorStore = useEditorStore();
  const toastStore = useToastStore();
  const tagsStore = useTagsStore();
  const sessionsStore = useSessionsStore();
  const card = ref<Card>(getEmptyCard(randomId()));
  if (editorStore.card) card.value = cloneDeep(editorStore.card);

  // --- Tags: ---

  const allTags = ref<TagsMap>(tagsStore.tags);
  const tagsOptions = computed(() => {
    const entries = Object.entries(allTags.value);
    const result: MultiselectOption[] = [];
    for (const [tag, count] of entries) {
      if (tag === 'audio' && !card.value.tags.includes('audio')) {
        // Audio tag cannot be manually added.
        continue;
      }
      const option: MultiselectOption = {
        text: `${tag} (${count})`,
        value: tag,
      };
      if (tag === 'audio') {
        option.class = 'audio non-closeable';
      }
      result.push(option);
    }
    return result;
  });

  function selectTag(tag: string) {
    card.value.tags.push(tag);
  }

  function deselectTag(tag: string) {
    if (tag === 'audio') return;
    arrayRemove(card.value.tags, tag);
    if (allTags.value[tag] === 0) {
      delete allTags.value[tag];
    }
  }

  function manuallyCreateTag(name: string) {
    if (name === 'audio') {
      toastStore.showToast('Cannot manually create the "audio" tag!', 'info');
      return;
    }
    if (name in allTags.value) return;
    allTags.value[name] = 0;
    card.value.tags.push(name);
  }

  // --- Sessions: ---

  const sessionsOptions = computed(() =>
    Object.values(sessionsStore.sessions).map((value) => ({
      text: `${value.name} (${value.count})`,
      value: value.id,
    }))
  );

  function selectSession(sessionId: string) {
    card.value.sessions.push(sessionId);
  }

  function deselectSession(sessionId: string) {
    arrayRemove(card.value.sessions, sessionId);
  }

  // --- RTE: ---

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
    if (field === 'back' && !content) {
      card.value.allowReversed = false;
    }
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

  // --- Media: ---

  const mediaRef = useTemplateRef('media');
  const hasMedia = computed(() => card.value.media.length > 0);

  function mediaClick() {
    if (!mediaRef.value) throw new Error('Media input not initialized!');
    mediaRef.value.triggerInput();
  }
  function mediaDrop(e: DragEvent) {
    if (!mediaRef.value) throw new Error('Media input not initialized!');
    mediaRef.value.drop(e);
  }

  function addMedia(items: MediaFile[]) {
    for (const file of items) {
      if (!file.type.includes('audio') && !file.type.includes('image')) {
        toastStore.showToast('Only images and audio can be added as media!', 'info');
        continue;
      }
      if (card.value.media.some((f) => f.name.trim() === file.name.trim())) {
        toastStore.showToast('Cannot have two media files with the same name!', 'info');
        continue;
      }
      if (file.type.includes('audio')) {
        const tag = 'audio';
        if (!(tag in allTags.value)) {
          allTags.value[tag] = 0;
        }
        if (!card.value.tags.includes(tag)) {
          card.value.tags.push(tag);
        }
      }
      card.value.media.push(file);
    }
  }
  function removeMedia(item: MediaFile) {
    card.value.media = card.value.media.filter((i) => i !== item);
    if (card.value.media.filter((m) => m.type.includes('audio')).length === 0) {
      card.value.tags = card.value.tags.filter((t) => t !== 'audio');
    }
  }

  // --- Others: ---

  function toggleFrequency(freq: CardFrequency) {
    card.value.frequency = freq;
  }

  const allowReversedTooltip = computed(() => {
    if (!card.value.back) {
      return 'Back field must not be empty';
    }
    return undefined;
  });

  function cancel() {
    router.back();
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 p-1 min-h-screen">
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
    <div class="media-input-container relative">
      <MediaInput
        ref="media"
        :items="card.media"
        :class="{ 'opacity-0': !hasMedia }"
        @add="addMedia"
        @remove="removeMedia"
      />
      <div
        v-if="!hasMedia"
        class="media-placeholder absolute inset-0 flex flex-col"
        @click="mediaClick"
        @drop="mediaDrop"
        @dragover.prevent
      >
        <div>Media</div>
        <div class="text-sm">(Click or drop files here)</div>
      </div>
    </div>
    <hr />
    <Multiselect
      :options="tagsOptions"
      :selected="card.tags"
      placeholder="Tags"
      direction="up"
      create
      close
      @select-option="selectTag"
      @deselect-option="deselectTag"
      @create-option="manuallyCreateTag"
    />
    <Multiselect
      :options="sessionsOptions"
      :selected="card.sessions"
      placeholder="Sessions"
      direction="up"
      close
      @select-option="selectSession"
      @deselect-option="deselectSession"
    />
    <div class="flex items-center justify-around">
      <div class="flex gap-1">
        <div>Frequency:</div>
        <SelectionList
          :options="[...FREQUENCY_OPTIONS]"
          :selected="[card.frequency]"
          @toggle="toggleFrequency"
        />
      </div>
      <div class="flex items-center gap-1">
        <label for="bucket-input">Review bucket:</label>
        <input type="checkbox" name="bucket-input" id="bucket-input" v-model="card.bucket" />
      </div>
    </div>
    <footer class="mt-auto flex justify-around">
      <div class="flex items-center gap-1">
        <label for="allow-reversed">Allow reversed:</label>
        <input
          type="checkbox"
          name="allow-reversed"
          id="allow-reversed"
          v-model="card.allowReversed"
          :disabled="!card.back"
          v-tooltip="allowReversedTooltip"
        />
      </div>
      <button type="button" class="btn-primary">Add</button>
      <button type="button" class="btn-warning">Cancel</button>
    </footer>
  </div>
</template>
