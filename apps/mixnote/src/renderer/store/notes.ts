import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { Note } from '@common/schemas/notes';
import { InvokeChannels } from '@preload/channels/invoke';

export const useNotesStore = defineStore('notes', {
  state: () => ({
    // This notes cache is used only for the editor, not the flashcards!
    notes: {} as Record<string, Note>,
  }),
  actions: {
    async initFromStartupData(data: StartupData) {
      if (data.tabGroups) {
        const noteIds = data.tabGroups.map((g) => g.tabs.map((t) => t.noteId)).flat();
        for (const noteId of noteIds) {
          await this.fetchNote(noteId);
        }
      }
    },
    getNoteFromCache(noteId: string): Note {
      if (!(noteId in this.notes)) {
        throw new Error(`getNoteFromCache: Note not found! ${noteId}`);
      }
      return this.notes[noteId];
    },
    async fetchNote(noteId: string): Promise<Note> {
      if (noteId in this.notes) return this.notes[noteId];
      const note = await window.api.invoke<Note>(InvokeChannels.getNote, noteId);
      this.notes[noteId] = note;
      return note;
    },
    clear() {
      this.notes = {};
    },
  },
});
