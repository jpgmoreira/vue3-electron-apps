<script setup lang="ts">
  import { computed } from 'vue';
  import { Card, CardFrequency } from '@common/schemas/card';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useUIStore } from '@renderer/store/ui';
  import { useSessionsStore } from '@renderer/store/sessions';
  import SelectionList from '@interapp/components/SelectionList.vue';
  import { FREQUENCY_OPTIONS } from '@renderer/helpers/options';

  const props = defineProps<{
    card: Card;
    reveal: boolean;
    flip: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'updateBucket'): void;
    (e: 'changeFrequency', frequency: CardFrequency): void;
  }>();

  const uiStore = useUIStore();
  const sessionsStore = useSessionsStore();

  const sessions = computed(() => props.card.sessions.map((s) => sessionsStore.sessions[s]));

  const front = computed(() => (props.flip ? props.card.back : props.card.front));
  const back = computed(() => (props.flip ? props.card.front : props.card.back));

  const frontTitle = computed(() => (props.flip ? 'Back' : 'Front'));
  const backTitle = computed(() => (props.flip ? 'Front' : 'Back'));

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }

  function mediaClick(media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const audio = new Audio(media.path);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.showMediaModal(media);
    }
  }
</script>

<template>
  <div class="flashcard">
    <div class="relative">
      <div class="field-title">{{ frontTitle }}:</div>
      <div v-html="front"></div>
    </div>
    <template v-if="reveal">
      <div v-if="back" class="relative">
        <div class="field-title">{{ backTitle }}:</div>
        <div v-html="card.back"></div>
      </div>
      <div v-if="card.extra" class="relative">
        <div class="field-title">Extra:</div>
        <div v-html="card.extra"></div>
      </div>
      <div class="content">
        <div v-if="card.media.length">
          <button
            type="button"
            v-for="m in card.media"
            class="media-button m-1"
            :class="mediaButtonClass(m.type)"
            @click="mediaClick(m)"
            v-tooltip="m.name"
          ></button>
        </div>
        <div>
          <div class="session-badge" v-for="session in sessions" :key="session.id">
            {{ session.name }}
          </div>
        </div>
        <div v-if="card.tags.length">
          <div class="tag-badge" v-for="tag in card.tags" :key="tag">
            {{ tag }}
          </div>
        </div>
        <div class="flex gap-36">
          <SelectionList
            :options="[...FREQUENCY_OPTIONS]"
            :selected="[card.frequency]"
            @toggle="emit('changeFrequency', $event)"
          />
          <div class="flex items-center gap-1">
            <label for="bucket-input">Review bucket:</label>
            <input
              type="checkbox"
              v-model="card.bucket"
              id="bucket-input"
              name="bucket-input"
              @change="emit('updateBucket')"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
