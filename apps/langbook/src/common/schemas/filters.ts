import type { Mode } from '@interapp/components/Multiselect.vue';
import type { YesOrNo } from '@interapp/types/yesOrNo';
import { CardFrequency } from './card';

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
