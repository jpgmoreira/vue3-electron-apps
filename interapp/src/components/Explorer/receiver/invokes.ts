import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeChannels } from '../preload/channels';
import { ExplorerManager } from '../main/explorerManager';
import { NodeType } from '../common/tree';
import { ModifierKeys } from '@interapp/types/modifierKeys';
import { TreeSnapshot } from '../common/treeSnapshot';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { sleep } from '@interapp/utils/utils';

ipcMain.handle(
  TreeChannels.createNode,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    prefix: string,
    parentId: string | null
  ): TreeSnapshot => {
    ExplorerManager.instance.createNode(type, prefix, parentId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.createNodeAbove,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeSnapshot => {
    ExplorerManager.instance.createNodeAbove(type, prefix, baseNodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.createNodeBelow,
  (
    _: IpcMainInvokeEvent,
    scrollTop: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeSnapshot => {
    ExplorerManager.instance.createNodeBelow(type, prefix, baseNodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(TreeChannels.getState, (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
  return ExplorerManager.instance.buildResult(scrollTop);
});

ipcMain.handle(
  TreeChannels.toggleDirOpen,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): TreeSnapshot => {
    ExplorerManager.instance.toggleDirOpen(nodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.renameNode,
  (_: IpcMainInvokeEvent, nodeId: string, newName: string): GenericResponseDTO => {
    return ExplorerManager.instance.renameNode(nodeId, newName);
  }
);

ipcMain.handle(
  TreeChannels.handleSelection,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string, keys: ModifierKeys): TreeSnapshot => {
    ExplorerManager.instance.handleSelection(nodeId, keys);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.deleteNode,
  async (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): Promise<TreeSnapshot> => {
    await sleep(1000);
    await ExplorerManager.instance.deleteNode(nodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.deleteSelectedNodes,
  async (_: IpcMainInvokeEvent, scrollTop: number): Promise<TreeSnapshot> => {
    await sleep(1000);
    await ExplorerManager.instance.deleteSelectedNodes();
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.collapseAll,
  (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
    ExplorerManager.instance.collapseAll();
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.clearSelection,
  (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
    ExplorerManager.instance.clearSelection();
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(TreeChannels.selectAll, (_: IpcMainInvokeEvent, scrollTop: number): TreeSnapshot => {
  ExplorerManager.instance.selectAll();
  return ExplorerManager.instance.buildResult(scrollTop);
});

ipcMain.handle(
  TreeChannels.moveSelectedFilesAbove,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    ExplorerManager.instance.moveSelectedFilesAbove(baseNodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesBelow,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    ExplorerManager.instance.moveSelectedFilesBelow(baseNodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersAbove,
  (_: IpcMainInvokeEvent, scrollTop: number, baseNodeId: string): TreeSnapshot => {
    ExplorerManager.instance.moveSelectedFoldersAbove(baseNodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersBelow,
  (_: IpcMainInvokeEvent, scrollTop: number, nodeId: string): TreeSnapshot => {
    ExplorerManager.instance.moveSelectedFoldersBelow(nodeId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedNodesInto,
  (_: IpcMainInvokeEvent, scrollTop: number, destinationId: string | null): TreeSnapshot => {
    ExplorerManager.instance.moveSelectedNodesInto(destinationId);
    return ExplorerManager.instance.buildResult(scrollTop);
  }
);
