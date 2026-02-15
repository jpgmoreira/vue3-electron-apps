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
    noteWasDeleted(noteId: string) {
      const initialIndex = this.index;
      for (let i = 0; i < this.history.length; i++) {
        if (this.history[i] === noteId && i <= initialIndex) {
          this.index = Math.max(0, this.index - 1);
        }
      }
      this.history = this.history.filter((id) => id !== noteId);
    },
  },
});
