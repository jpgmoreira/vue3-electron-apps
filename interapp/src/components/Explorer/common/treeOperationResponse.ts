import { Node } from './tree';

export type TreeOperationResponse = {
  nTotalNodes: number;
  nSurfaceNodes: number;
  nSelectedNodes: number;
  nSelectedFiles: number;
  nOpenDirs: number;
  page: Node[];
};
