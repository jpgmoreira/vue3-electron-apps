import { MediaFile } from './mediaFile';

export type CardFrequency = 'low' | 'normal' | 'high';

export type Card = {
  id: string;
  front: string;
  back: string;
  extra: string;
  media: MediaFile[];
  allowReversed: boolean;
  createdAt: number;
  lastReviewedAt: number | null;
  sessions: string[];
  tags: string[];
  frequency: CardFrequency;
  bucket: boolean;
};

export function getEmptyCard(id: string): Card {
  return {
    id,
    front: '',
    back: '',
    extra: '',
    media: [],
    allowReversed: false,
    createdAt: Date.now(),
    lastReviewedAt: null,
    sessions: [],
    tags: [],
    frequency: 'normal',
    bucket: false,
  };
}
