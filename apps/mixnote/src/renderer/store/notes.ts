import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { Note } from '@common/schemas/notes';
import { InvokeChannels } from '@preload/channels/invoke';
import { cloneDeep } from '@interapp/utils/utils';

export const useNotesStore = defineStore('notes', {
  state: () => ({
    // This notes cache is used only for the editor, not the flashcards!
    notes: {} as Record<string, Note>,
    timers: {} as Record<string, ReturnType<typeof setTimeout> | undefined>,
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
    updateCachedNoteHead(noteId: string, content: string) {
      const note = this.notes[noteId];
      if (!note) throw new Error(`Update cached note head: Note id not found! ${noteId}`);
      note.head = content;
      note.lastModified = Date.now();
      this.persistNote(note);
    },
    persistNote(note: Note) {
      clearTimeout(this.timers[note.id]);
      this.timers[note.id] = setTimeout(() => {
        window.api.invoke(InvokeChannels.updateNote, cloneDeep(note));
      }, 500);
    },
    async renameNote(noteId: string, newName: string) {
      // Rename came from the Explorer component.
      // Note can be present or absent in the cache.
      const wasInCache = noteId in this.notes;
      const note = await this.fetchNote(noteId);
      note.name = newName;
      this.persistNote(note);
      if (!wasInCache) delete this.notes[noteId];
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
