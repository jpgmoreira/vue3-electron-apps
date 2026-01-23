<script lang="ts" setup>
  /**
   * The "items" prop must contain an array with objects in the form:
   * {
   *      name: string,
   *      path: string,
   *      type: string
   * }
   */
  import { type MediaFile } from '@interapp/types/mediaFile';
  import { useTemplateRef } from 'vue';
  const emit = defineEmits<{
    (e: 'add', files: MediaFile[]): void;
    (e: 'remove', item: MediaFile): void;
  }>();
  const props = withDefaults(defineProps<{ items?: MediaFile[] }>(), { items: () => [] });
  const inputRef = useTemplateRef('input-ref');
  function triggerInput() {
    inputRef.value?.click();
  }
  async function addFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target || !target.files) return;
    const files: MediaFile[] = [];
    for (const file of target.files) {
      const path = window.media.resolveFilePath(file);
      files.push({ name: file.name, type: file.type, path });
    }
    target.value = ''; // Necessary. Comment this line and try to add a file, remove it, then add it again to see why.
    emit('add', files);
  }
  function removeFile(item: MediaFile) {
    emit('remove', item);
  }
  function drop(event: DragEvent) {
    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    const fakeEvent = {
      target: { files: dt.files },
    } as unknown as Event;
    addFiles(fakeEvent);
  }
  defineExpose({
    triggerInput,
    drop,
  });
</script>

<template>
  <div class="media-input-root">
    <input
      ref="input-ref"
      type="file"
      class="media-input"
      accept="image/*,audio/*"
      @change="addFiles"
      title=""
      multiple
    />
    <div class="media-item-parent" @click="triggerInput" @drop="drop" @dragover.prevent>
      <span class="media-item" v-for="item in props.items" :key="item.name">
        <span class="media-name">{{ item.name }}</span>
        <button
          type="button"
          class="media-item-remove"
          @dblclick="removeFile(item)"
          @click.stop
          v-tooltip="'Double-click to remove'"
        >
          ❌
        </button>
      </span>
    </div>
  </div>
</template>
