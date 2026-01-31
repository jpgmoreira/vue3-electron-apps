<script lang="ts" setup>
  import { ref, useTemplateRef, computed } from 'vue';
  import RichTextEditor from '@interapp/components/RichTextEditor/RichTextEditor.vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useRouter } from 'vue-router';
  import { useToastStore } from '@interapp/store/toast';
  import { arrayRemove, cloneDeep, randomId, toRawDeep } from '@interapp/utils/utils';
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
  import { InvokeChannels } from '@preload/channels/invoke';
  import { useProfileStore } from '@renderer/store/profile';

  const router = useRouter();
  const editorStore = useEditorStore();
  const toastStore = useToastStore();
  const tagsStore = useTagsStore();
  const sessionsStore = useSessionsStore();
  const profileStore = useProfileStore();
  const card = ref<Card>(getEmptyCard(randomId()));
  if (editorStore.card) card.value = cloneDeep(editorStore.card);

  const isCreate = !Boolean(editorStore.card);

  // --- Tags: ---

  const allTags = ref<TagsMap>(cloneDeep(tagsStore.tags));
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

  const mostRecentSession = sessionsStore.getMostRecentSession();
  if (mostRecentSession) {
    card.value.sessions.push(mostRecentSession.id);
  }

  function selectSession(sessionId: string) {
    card.value.sessions.push(sessionId);
  }

  function deselectSession(sessionId: string) {
    arrayRemove(card.value.sessions, sessionId);
  }

  // --- RTE: ---

  type RTEField = 'front' | 'back' | 'extra';

  const rteRefs = ref({
    front: useTemplateRef('front'),
    back: useTemplateRef('back'),
    extra: useTemplateRef('extra'),
  });

  function refreshContent(field: RTEField) {
    if (!rteRefs.value[field]) throw new Error('RTE ref not set!');
    card.value[field] = rteRefs.value[field].getContent();
    if (field === 'back' && !card.value.back) {
      card.value.allowReversed = false;
    }
  }

  // --- Media: ---

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

  // --- Operations: ---

  function cancel() {
    router.back();
  }

  async function addCard() {
    refreshContent('front');
    refreshContent('back');
    refreshContent('extra');
    if (!card.value.front) {
      toastStore.showToast('A card must at least have a front field!', 'info');
      return;
    }
    if (!card.value.sessions.length) {
      toastStore.showToast('A card must be on at least one session!', 'info');
      return;
    }
    await window.api.invoke(InvokeChannels.createCard, toRawDeep(card.value));
    await tagsStore.refetch();
    await sessionsStore.refetch();
    await profileStore.refetch();
    router.back();
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 p-1 min-h-screen">
    <div class="card-field">
      <div class="card-label">Front</div>
      <RichTextEditor ref="front" :initial="card.front" />
    </div>
    <div class="card-field">
      <div class="card-label">Back</div>
      <RichTextEditor ref="back" :initial="card.back" @blur="refreshContent('back')" />
    </div>
    <div class="card-field">
      <div class="card-label">Extra</div>
      <RichTextEditor ref="extra" :initial="card.extra" />
    </div>
    <div class="card-field">
      <div class="card-label">Media (click or drop)</div>
      <MediaInput :items="card.media" @add="addMedia" @remove="removeMedia" />
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
      <template v-if="isCreate">
        <button type="button" class="btn-primary" @click="addCard">Add</button>
        <button type="button" class="btn-warning" @click="cancel">Cancel</button>
      </template>
    </footer>
  </div>
</template>
