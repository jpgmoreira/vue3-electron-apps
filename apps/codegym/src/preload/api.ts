import { Channels } from '@common/types/channels';
import { TreeChannels } from '@common/types/treeChannels';

export const allowedSendChannels = Object.freeze([
  Channels.updateCurrOj,
  Channels.updateCurrPage,
  Channels.setCurrSnapshotSolvedDate,
  Channels.updateOjFilters,
  Channels.setCurrOjSnapshot,
  Channels.logout,
  Channels.deleteCurrProfile,
  Channels.updateCurrContestNotes,
  Channels.updateCurrContestProblem,
] as const);
export const allowedInvokeChannels = Object.freeze([
  Channels.createProfile,
  Channels.updateOjCache,
  Channels.getOjProblem,
  Channels.login,
  Channels.fetchHistoryPage,
  Channels.renameCurrProfile,
  Channels.getContest,
  Channels.addCurrContestProblem,
  Channels.toggleCurrContestProblemFlag,
  Channels.deleteCurrContestProblem,
  // Channels to perform treeview operations:
  TreeChannels.createNode,
  TreeChannels.createNodeAbove,
  TreeChannels.createNodeBelow,
  TreeChannels.getState,
  TreeChannels.toggleDirOpen,
  TreeChannels.renameNode,
  TreeChannels.handleSelection,
  TreeChannels.deleteNode,
  TreeChannels.deleteSelectedNodes,
  TreeChannels.search,
  TreeChannels.collapseAll,
  TreeChannels.clearSelection,
  TreeChannels.selectAll,
  TreeChannels.moveSelectedFilesAbove,
  TreeChannels.moveSelectedFilesBelow,
  TreeChannels.moveSelectedFoldersAbove,
  TreeChannels.moveSelectedFoldersBelow,
  TreeChannels.moveSelectedNodesInto,
] as const);
export const allowedOnChannels = Object.freeze([Channels.loadStartupData] as const);

export interface ElectronAPI {
  send: (channel: (typeof allowedSendChannels)[number], ...data: any[]) => void;
  invoke: <T = void>(channel: (typeof allowedInvokeChannels)[number], ...data: any[]) => Promise<T>;
  on: (channel: (typeof allowedOnChannels)[number], func: (...args: any[]) => void) => void;
}
