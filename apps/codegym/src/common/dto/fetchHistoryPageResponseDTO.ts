import { OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/schemas/oj';

export type FetchHistoryPageResponseDTO<T extends Oj> = {
  data: OjProblem[T][];
  total: number;
};
