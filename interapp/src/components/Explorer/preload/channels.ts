/**
 * Allowed communication channels between main and renderer processes to perform explorer operations.
 * All the channels are sent from the renderer to the main via invoke.
 */
export enum TreeChannels {
  createNode = 'create-node',
  createNodeAbove = 'create-node-above',
  createNodeBelow = 'create-node-below',
  getPage = 'get-page',
  toggleDirOpen = 'toggle-dir-open',
  renameNode = 'rename-node',
  handleSelection = 'handle-selection',
  deleteNode = 'delete-node',
  deleteSelectedNodes = 'delete-selected-nodes',
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
