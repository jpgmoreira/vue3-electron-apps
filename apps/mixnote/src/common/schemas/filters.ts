import { YesOrNo } from '@interapp/types/yesOrNo';
import { NoteFrequency } from './notes';

export type Filters = {
  bucket: YesOrNo[];
  frequencies: NoteFrequency[];
};

export function getEmptyFilters(): Filters {
  return {
    bucket: [],
    frequencies: [],
  };
}
