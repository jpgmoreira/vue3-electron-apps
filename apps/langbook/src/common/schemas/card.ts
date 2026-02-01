import { MediaFile } from '@interapp/types/mediaFile';

export type CardFrequency = 'low' | 'normal' | 'high';

export const CARD_RTE_FIELDS = Object.freeze(['front', 'back', 'extra']);

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
  height: number;
  // UI properties not stored in the database:
  ui: {
    scrollTop: number;
    position: number;
  };
};

// How cards are stored in the sqlite DB.
export type DBCard = {
  id: string;
  front: string;
  back: string;
  extra: string;
  media: string;
  allowReversed: boolean;
  createdAt: number;
  lastReviewedAt: number | null;
  sessions: string;
  tags: string;
  frequency: string;
  bucket: boolean;
  height: number;
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
    height: 0,
    ui: {
      scrollTop: 0,
      position: 0,
    },
  };
}
