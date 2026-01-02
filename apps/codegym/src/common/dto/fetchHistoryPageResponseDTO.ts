import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';

export type FetchHistoryPageResponseDTO<T extends Oj> = {
  data: OjProblem[T][];
  total: number;
};
