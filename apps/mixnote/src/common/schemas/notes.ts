import { buildId } from '@interapp/utils/utils';

export type NoteFrequency = 'high' | 'normal' | 'low';

export type Note = {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  head: string;
  body: string;
  frequency: NoteFrequency;
  bucket: boolean;
};

export function getEmptyNote(name: string, timestamp: number): Note {
  const noteId = buildId(name, timestamp);
  return {
    id: noteId,
    name,
    createdAt: timestamp,
    lastModified: timestamp,
    head: '',
    body: '',
    frequency: 'normal',
    bucket: false,
  };
}
