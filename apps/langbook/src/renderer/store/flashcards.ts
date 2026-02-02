import { defineStore } from 'pinia';

export const useFlashcardsStore = defineStore('flashcards', {
  state: () => ({
    history: [] as string[],
    index: 0,
    reveal: false,
  }),
  actions: {
    reset() {
      this.history = [];
      this.index = 0;
      this.reveal = false;
    },
  },
});
