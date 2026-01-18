import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { contestsManager, nodeCounterManager } from '@main/startup/instances';
import { Contest, ContestProblem } from '@common/schemas/contests';

ipcMain.handle(InvokeChannels.createFolder, (_: IpcMainInvokeEvent): number => {
  const number = nodeCounterManager.getCounter().nextDir;
  nodeCounterManager.increment('dir');
  return number;
});

ipcMain.handle(InvokeChannels.createContest, (_: IpcMainInvokeEvent): Contest => {
  return contestsManager.createContest();
});

ipcMain.handle(InvokeChannels.getContest, (_: IpcMainInvokeEvent, contestId: string): Contest => {
  return contestsManager.getContest(contestId);
});

ipcMain.handle(
  InvokeChannels.renameContest,
  (_: IpcMainInvokeEvent, contestId: string, newName: string) => {
    contestsManager.renameContest(contestId, newName);
  }
);

ipcMain.handle(InvokeChannels.contestExists, (_: IpcMainInvokeEvent, contestId: string) => {
  return contestsManager.contestExists(contestId);
});

ipcMain.handle(
  InvokeChannels.addContestProblem,
  (_: IpcMainInvokeEvent, contestId: string): ContestProblem => {
    return contestsManager.addContestProblem(contestId);
  }
);

ipcMain.handle(
  InvokeChannels.updateContestNotes,
  (_: IpcMainInvokeEvent, contestId: string, notes: string) => {
    return contestsManager.updateContestNotes(contestId, notes);
  }
);
