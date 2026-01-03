import { Node } from './tree';

export type TreeSnapshot = {
  totalNodes: number;
  surfaceNodes: number;
  selectedNodes: number;
  selectedFiles: number;
  openDirs: number;
  page: Node[];
};
