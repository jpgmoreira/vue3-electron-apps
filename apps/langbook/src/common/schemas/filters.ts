import type { YesOrNo } from '@interapp/types/yesOrNo';
import { CardFrequency } from './card';

type Mode = 'all' | 'any';

export type Filters = {
  text: string;
  tags: string[];
  tagMode: Mode;
  frequencies: CardFrequency[];
  bucket: YesOrNo[];
};

export function getEmptyFilters(): Filters {
  return {
    text: '',
    tags: [],
    tagMode: 'all',
    frequencies: [],
    bucket: [],
  };
}
