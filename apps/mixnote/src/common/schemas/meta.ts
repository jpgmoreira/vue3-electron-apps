import { NoteFrequency } from './notes';

export type Meta = {
  noteId: string;
  lastReviewedAt: number;
  frequency: NoteFrequency;
  bucket: boolean;
};
