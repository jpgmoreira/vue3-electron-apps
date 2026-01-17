import { Oj } from '@common/schemas/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { Status } from '@interapp/types/status';

export type UpdateCacheResponseDTO<T extends Oj> = {
  status: Status;
  message?: string;
  meta: OjMeta[T];
};
