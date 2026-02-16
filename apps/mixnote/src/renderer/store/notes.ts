import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { Note, NoteFrequency } from '@common/schemas/notes';
import { InvokeChannels } from '@preload/channels/invoke';
import { cloneDeep } from '@interapp/utils/utils';

export const useNotesStore = defineStore('notes', {
  state: () => ({
    // - The notes cached here are just notes from the editor tabs.
    // - Notes from the flashcards study are not cached.
    // - To avoid race-condition problems, I do not clear the cache when closing a note.
    //   By the application normal usage I can assume it will never store a very large number of notes.
    // - The entire cache is refetched in the case where you clear the bucket or frequency properties
    //   of the selected cards in the pre-flashcards window.
    notes: {} as Record<string, Note>,
    timers: {} as Record<string, ReturnType<typeof setTimeout> | undefined>,
    isFetchingCache: false,
  }),
  actions: {
    async initFromStartupData(data: StartupData) {
      if (data.tabGroups) {
        const noteIds = data.tabGroups.map((g) => g.tabs.map((t) => t.noteId)).flat();
        await this.refetchCache(noteIds);
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
      note.lastModifiedAt = Date.now();
      this.persistNote(note);
    },
    updateCachedNoteBody(noteId: string, content: string) {
      const note = this.notes[noteId];
      if (!note) throw new Error(`Update cached note body: Note id not found! ${noteId}`);
      note.body = content;
      note.lastModifiedAt = Date.now();
      this.persistNote(note);
    },
    setCachedNoteBucket(noteId: string, value: boolean) {
      const note = this.notes[noteId];
      if (!note) throw new Error(`Set cached note bucket: Note id not found! ${noteId}`);
      note.bucket = value;
      this.persistNote(note);
    },
    setCachedNoteFrequency(noteId: string, frequency: NoteFrequency) {
      const note = this.notes[noteId];
      if (!note) throw new Error(`Set cached note frequency: Note id not found! ${noteId}`);
      note.frequency = frequency;
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
      // Do not clear the cache here.
      const note = await this.fetchNote(noteId);
      note.name = newName;
      this.persistNote(note);
    },
    async fetchNote(noteId: string): Promise<Note> {
      if (noteId in this.notes) return this.notes[noteId];
      const note = await window.api.invoke<Note>(InvokeChannels.getNote, noteId);
      this.notes[noteId] = note;
      return note;
    },
    async refetchNote(noteId: string) {
      if (!(noteId in this.notes)) return;
      delete this.notes[noteId];
      await this.fetchNote(noteId);
    },
    async refetchCache(noteIds: string[]) {
      if (this.isFetchingCache) return;
      try {
        this.isFetchingCache = true;
        this.clear();
        for (const noteId of noteIds) {
          await this.fetchNote(noteId);
        }
      } finally {
        this.isFetchingCache = false;
      }
    },
    clear() {
      this.notes = {};
      this.timers = {};
    },
  },
});
