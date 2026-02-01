import { Card } from '@common/schemas/card';
import { cloneDeep } from '@interapp/utils/utils';
import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    card: null as Card | null,
  }),
  actions: {
    setCard(card: Card) {
      this.card = cloneDeep(card);
    },
    clear() {
      this.card = null;
    },
  },
});
