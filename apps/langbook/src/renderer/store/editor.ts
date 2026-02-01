import { Card } from '@common/schemas/card';
import { cloneDeep } from '@interapp/utils/utils';
import { defineStore } from 'pinia';
import { useMediaStore } from './media';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    card: null as Card | null,
  }),
  actions: {
    setCard(card: Card) {
      const mediaStore = useMediaStore();
      this.card = cloneDeep(card);
      this.card.front = mediaStore.processRteImages(card.id, card.front);
      this.card.back = mediaStore.processRteImages(card.id, card.back);
      this.card.extra = mediaStore.processRteImages(card.id, card.extra);
    },
    clear() {
      this.card = null;
    },
  },
});
