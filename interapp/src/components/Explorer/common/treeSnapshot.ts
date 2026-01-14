import { Node } from './tree';

export type TreeSnapshot = {
  nTotalNodes: number;
  nSurfaceNodes: number;
  nSelectedNodes: number;
  nSelectedFiles: number;
  nOpenDirs: number;
  page: Node[];
};
