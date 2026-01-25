import { Card } from '@common/schemas/card';

export type GetCardsPageResponseDTO = {
  page: Card[];
  totalHeight: number;
};
