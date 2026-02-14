import { buildId } from '@interapp/utils/utils';

export type NoteFrequency = 'high' | 'normal' | 'low';

export type Note = {
  id: string;
  name: string;
  createdAt: number;
  lastModifiedAt: number;
  head: string;
  body: string;
  frequency: NoteFrequency;
  bucket: boolean;
};

// Persistent notes will not have bucket and frequency,
//   because these are stored on separate json files.
// Persisting them would result in inconsistencies
//   when clearing the bucket or frequency status of
//   a large number of notes, because I cannot enter
//   every file to modify it.
export type PersistentNote = {
  id: string;
  name: string;
  createdAt: number;
  lastModifiedAt: number;
  head: string;
  body: string;
};

export function getEmptyNote(name: string, timestamp: number): Note {
  const noteId = buildId(name, timestamp);
  return {
    id: noteId,
    name,
    createdAt: timestamp,
    lastModifiedAt: timestamp,
    head: '',
    body: '',
    frequency: 'normal',
    bucket: false,
  };
}

export function getEmptyPersistentNote(name: string, timestamp: number): PersistentNote {
  const noteId = buildId(name, timestamp);
  return {
    id: noteId,
    name,
    createdAt: timestamp,
    lastModifiedAt: timestamp,
    head: '',
    body: '',
  };
}
