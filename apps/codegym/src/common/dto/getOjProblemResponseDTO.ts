import { Oj } from '@common/types/oj';
import { OjProblem } from '@common/schemas/problems';

/**
 * Result of a request for a new problem to the main process.
 */
export type GetOjProblemResponseDTO<T extends Oj> = {
  snapshot: OjProblem[T] | null;
  matched: number;
};
