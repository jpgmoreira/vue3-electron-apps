/**
 * Allowed communication channels between main and renderer processes to perform treeview operations.
 */
export enum TreeChannels {
  createNode = 'create-node',
  createNodeAbove = 'create-node-above',
  createNodeBelow = 'create-node-below',
  getState = 'get-state',
  toggleDirOpen = 'toggle-dir-open',
  renameNode = 'rename-node',
  handleSelection = 'handle-selection',
  deleteNode = 'delete-node',
  deleteSelectedNodes = 'delete-selected-nodes',
  search = 'search',
  collapseAll = 'collapse-all',
  clearSelection = 'clear-selection',
  selectAll = 'select-all',

  // Move operations
  moveSelectedFilesAbove = 'move-selected-files-above',
  moveSelectedFilesBelow = 'move-selected-files-below',
  moveSelectedFoldersAbove = 'move-selected-folders-above',
  moveSelectedFoldersBelow = 'move-selected-folders-below',
  moveSelectedNodesInto = 'move-selected-nodes-into',
}
