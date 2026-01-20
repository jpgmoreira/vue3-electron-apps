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
  lastReviewedAt: number;
  sessions: string[];
  tags: string[];
  frequency: CardFrequency;
  bucket: boolean;
};
