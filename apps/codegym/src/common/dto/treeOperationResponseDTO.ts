import { Node } from '@common/types/tree';

export type TreeOperationResponseDTO = {
  nTotalNodes: number;
  nSurfaceNodes: number;
  nSelectedNodes: number;
  nSelectedFiles: number;
  nOpenDirs: number;
  anchor: number;
  visibleNodes: Node[];
};
