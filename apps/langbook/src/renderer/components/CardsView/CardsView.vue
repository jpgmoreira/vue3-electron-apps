<script lang="ts" setup>
  import { onMounted, ref, reactive, useTemplateRef, nextTick } from 'vue';
  import MainCard from './MainCard.vue';
  import { MediaFile } from '@interapp/types/mediaFile';
  import { useMediaStore } from '@renderer/store/media';
  import { useUIStore } from '@renderer/store/ui';
  import { Card } from '@common/schemas/card';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';
  import DeleteCardModal from '../DeleteCardModal.vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useRouter } from 'vue-router';

  const editorStore = useEditorStore();
  const mediaStore = useMediaStore();
  const uiStore = useUIStore();
  const initialScrollTop = uiStore.cardsScrollTop;
  const cards = ref<Card[]>([]);
  const totalHeight = ref(0);
  const isFetching = ref(false);
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fetchSeq = ref(0);
  const scrollRef = useTemplateRef('scroll-ref');

  const hasLoaded = ref(false);

  const router = useRouter();

  const emit = defineEmits<{
    (e: 'deleted'): void;
  }>();

  const contextStyle = reactive({
    visible: false,
    top: '0px',
    left: '0px',
  });
  const contextCard = ref<Card | null>(null);

  const contextRef = useTemplateRef('context-ref');

  const deleteCardModalRef = useTemplateRef('delete-card-modal');

  function showContext(card: Card, e: MouseEvent) {
    const context = contextRef.value;
    if (!context) throw new Error('Context not set!');
    contextCard.value = card;
    contextStyle.visible = true;
    let top = e.clientY;
    let left = e.clientX;
    const box = context.getBoundingClientRect();
    top = Math.min(top, window.innerHeight - box.height);
    left = Math.min(left, window.innerWidth - box.width);
    contextStyle.top = `${top}px`;
    contextStyle.left = `${left}px`;
  }

  function hideContext() {
    contextStyle.visible = false;
    contextCard.value = null;
  }

  function onDeleteClick() {
    if (!contextCard.value) throw new Error('Context card not set!');
    const modal = deleteCardModalRef.value;
    if (!modal) throw new Error('Modal not set!');
    modal.show(contextCard.value);
  }

  function onEditClick() {
    if (!contextCard.value) throw new Error('Context card not set!');
    editorStore.setCard(contextCard.value);
    router.push('/editor');
  }

  async function fetchCards(scrollTop: number) {
    isFetching.value = true;
    try {
      fetchSeq.value++;
      const seq = fetchSeq.value;
      const data = await window.api.invoke<GetCardsPageResponseDTO>(
        InvokeChannels.getCardsPage,
        scrollTop
      );
      if (seq !== fetchSeq.value) return;
      cards.value = data.page;
      totalHeight.value = data.totalHeight;
    } finally {
      isFetching.value = false;
    }
  }

  function onScroll() {
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(() => {
      if (isFetching.value) return;
      const scroll = scrollRef.value;
      if (!scroll) throw new Error('Scroll not defined!');
      const scrollTop = scroll.scrollTop;
      uiStore.setCardsScrollTop(scrollTop);
      fetchCards(scrollTop);
    }, 30);
  }
  function mediaClick(cardId: string, media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = mediaStore.resolveMediaPath(cardId, media.path);
      const audio = new Audio(mediaPath);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.showMediaModal(cardId, media);
    }
  }
  defineExpose({
    fetchCards,
  });
  onMounted(async () => {
    await fetchCards(initialScrollTop);
    await nextTick();
    hasLoaded.value = true;
    if (!scrollRef.value) throw new Error('No scroll ref!');
    scrollRef.value.scrollTop = initialScrollTop;
  });
</script>

<template>
  <div class="grow relative" @click="hideContext" @wheel="hideContext">
    <DeleteCardModal ref="delete-card-modal" @deleted="emit('deleted')" />

    <div
      v-show="contextStyle.visible"
      ref="context-ref"
      class="custom-context-menu"
      :style="contextStyle"
    >
      <div class="item" @click="onEditClick">Edit</div>
      <div class="item danger" @click="onDeleteClick">Delete</div>
    </div>
    <div ref="scroll-ref" class="absolute inset-0 overflow-auto pb-48" @scroll="onScroll">
      <div v-if="cards.length">
        <div :style="{ height: `${totalHeight}px` }"></div>
        <div
          v-for="card in cards"
          :key="card.id"
          class="absolute left-0 w-full"
          :style="{ top: `${card.ui.scrollTop}px` }"
        >
          <MainCard
            :card="card"
            @media-click="mediaClick"
            @click.right="showContext(card, $event)"
          />
        </div>
      </div>
      <div v-else-if="hasLoaded" class="absolute-center message-xl z-0">No cards</div>
    </div>
  </div>
</template>
