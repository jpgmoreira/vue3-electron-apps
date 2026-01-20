<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { NodeType } from '@interapp/components/Explorer/common/tree';
  import { useUIStore } from '@renderer/store/ui';
  import { useTagsStore } from '@renderer/store/tags';
  import { useFiltersStore } from '@renderer/store/filters';
  import Header from '@renderer/components/Header.vue';
  import Multiselect from '@interapp/components/Multiselect.vue';
  import Explorer, {
    CreateNodeCallback,
  } from '@interapp/components/Explorer/renderer/Explorer.vue';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { randomId } from '@interapp/utils/utils';
  import { Session } from '@common/schemas/session';
  import { useRouter } from 'vue-router';
  import { MultiselectOption } from '@interapp/components/Multiselect.vue';
  import SelectionList from '@interapp/components/SelectionList.vue';
  import { FREQUENCY_OPTIONS, YES_OR_NO_OPTIONS } from './options';
  const uiStore = useUIStore();
  const tagsStore = useTagsStore();
  const filtersStore = useFiltersStore();
  const router = useRouter();
  const resizing = ref(false);
  const explorerWidth = ref(uiStore.settings.explorerWidth);
  const initialExplorerScroll = uiStore.settings.explorerScrollTop;
  const filterTags = computed(() => filtersStore.filters.tags);
  const tagsOptions = computed(() => {
    const entries = Object.entries(tagsStore.tags);
    const result: MultiselectOption[] = [];
    for (const [tag, count] of entries) {
      const option: MultiselectOption = {
        text: `${tag} (${count})`,
        value: tag,
      };
      if (tag === 'audio') {
        option.class = 'audio';
      }
      result.push(option);
    }
    return result;
  });
  function toggleShowFilters() {
    uiStore.showFilters = !uiStore.showFilters;
  }
  function goAddCard() {
    router.push('/editor');
  }
  function explorerScroll(scrollTop: number) {
    uiStore.updateSettings({ explorerScrollTop: scrollTop });
  }
  async function beforeCreateNode(type: NodeType, callback: CreateNodeCallback) {
    if (type === 'dir') {
      const number = await window.api.invoke<number>(InvokeChannels.createFolder);
      const name = `Folder ${number}`;
      const id = randomId();
      callback(id, name);
    } else {
      const session = await window.api.invoke<Session>(InvokeChannels.createSession);
      callback(session.id, session.name);
    }
  }
  function windowMouseMove(e: MouseEvent) {
    if (!resizing.value) return;
    const { clientX } = e;
    if (clientX < 0 || clientX > window.innerWidth) {
      return;
    }
    explorerWidth.value = clientX;
    uiStore.updateSettings({ explorerWidth: clientX });
  }
  function windowMouseUp() {
    resizing.value = false;
  }
  onMounted(async () => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="cards-page flex flex-col h-screen overflow-hidden" :class="{ resizing }">
    <Header />
    <div class="flex grow">
      <div :style="{ width: `${explorerWidth}px` }">
        <Explorer
          file-icon
          checkbox
          :initial-scroll-top="initialExplorerScroll"
          @scroll="explorerScroll"
          @before-create-node="beforeCreateNode"
        />
      </div>
      <div class="custom-resizer" @mousedown="resizing = true"></div>
      <div class="grow relative" style="border: 1px solid orchid">
        <div class="flex flex-col absolute inset-0" style="border: 1px solid lightgreen">
          <div class="grow"></div>
          <div v-if="uiStore.showFilters" class="filters-container flex flex-col px-2 py-1.5 gap-1">
            <div>Filters:</div>
            <Multiselect
              :options="tagsOptions"
              :selected="filterTags"
              placeholder="Tags"
              direction="up"
              close
              :mode="filtersStore.filters.tagMode"
            />
            <input
              type="text"
              placeholder="Text"
              spellcheck="false"
              v-model.trim="filtersStore.filters.text"
              @input="filtersStore.dirty = true"
            />
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <span>Frequency:</span>
                <SelectionList
                  :options="[...FREQUENCY_OPTIONS]"
                  :selected="filtersStore.filters.frequencies"
                />
              </div>
              <div class="flex items-center gap-1">
                <span>Review bucket:</span>
                <SelectionList
                  :options="[...YES_OR_NO_OPTIONS]"
                  :selected="filtersStore.filters.bucket"
                />
              </div>
            </div>
          </div>
          <footer class="flex items-center justify-evenly mt-auto">
            <button
              type="button"
              class="caret-button"
              :class="{ rotated: !uiStore.showFilters }"
              @click="toggleShowFilters"
            ></button>
            <button type="button" class="btn-primary">Filter</button>
            <button type="button" class="btn-primary">Clear</button>
            <button type="button" class="btn-primary whitespace-nowrap" @click="goAddCard">
              Add card
            </button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .cards-page.resizing {
    cursor: col-resize;
  }
  .caret-button {
    transition: transform 0.2s ease;
  }
  .caret-button.rotated {
    transform: rotate(180deg);
  }
</style>
