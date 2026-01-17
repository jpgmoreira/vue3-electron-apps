export type NodeType = 'file' | 'folder';

export type NodeCounter = {
  nextFile: number;
  nextFolder: number;
};

export function getEmptyNodeCounter(): NodeCounter {
  return {
    nextFile: 1,
    nextFolder: 1,
  };
}
