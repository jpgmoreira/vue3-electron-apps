export type NodeType = 'file' | 'dir';

export type NodeCounter = {
  nextFile: number;
  nextDir: number;
};

export function getEmptyNodeCounter(): NodeCounter {
  return {
    nextFile: 1,
    nextDir: 1,
  };
}
