import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeChannels } from '../preload/channels';
import { NodeType } from '../common/tree';
import { ModifierKeys } from '@interapp/types/modifierKeys';
import { TreeSnapshot } from '../common/treeSnapshot';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { explorerManager } from '../main/instances/instances';

ipcMain.handle(
  TreeChannels.createNode,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    nodeId: string,
    parentId: string | null,
    name: string
  ): TreeSnapshot => {
    explorerManager.createNode(type, nodeId, parentId, name);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.createNodeAbove,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    nodeId: string,
    baseNodeId: string,
    name: string
  ): TreeSnapshot => {
    explorerManager.createNodeAbove(type, nodeId, baseNodeId, name);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.createNodeBelow,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    nodeId: string,
    baseNodeId: string,
    name: string
  ): TreeSnapshot => {
    explorerManager.createNodeBelow(type, nodeId, baseNodeId, name);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(TreeChannels.getPage, (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
  return explorerManager.buildResult(scrollTop);
});

ipcMain.handle(
  TreeChannels.toggleDirOpen,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): TreeSnapshot => {
    explorerManager.toggleDirOpen(nodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.renameNode,
  (_: IpcMainInvokeEvent, nodeId: string, newName: string): GenericResponseDTO => {
    return explorerManager.renameNode(nodeId, newName);
  }
);

ipcMain.handle(
  TreeChannels.handleSelection,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string, keys: ModifierKeys): TreeSnapshot => {
    explorerManager.handleSelection(nodeId, keys);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.deleteNode,
  async (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): Promise<TreeSnapshot> => {
    await explorerManager.deleteNode(nodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.deleteSelectedNodes,
  async (_: IpcMainInvokeEvent, scrollTop: number): Promise<TreeSnapshot> => {
    await explorerManager.deleteSelectedNodes();
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.collapseAll,
  (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
    explorerManager.collapseAll();
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.clearSelection,
  (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
    explorerManager.clearSelection();
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(TreeChannels.selectAll, (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
  explorerManager.selectAll();
  return explorerManager.buildResult(scrollTop);
});

ipcMain.handle(
  TreeChannels.moveSelectedFilesAbove,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    explorerManager.moveSelectedFilesAbove(baseNodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesBelow,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    explorerManager.moveSelectedFilesBelow(baseNodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersAbove,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    explorerManager.moveSelectedFoldersAbove(baseNodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersBelow,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): TreeSnapshot => {
    explorerManager.moveSelectedFoldersBelow(nodeId);
    return explorerManager.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedNodesInto,
  (_: IpcMainInvokeEvent, scrollTop: number, destinationId: string | null): TreeSnapshot => {
    explorerManager.moveSelectedNodesInto(destinationId);
    return explorerManager.buildResult(scrollTop);
  }
);
