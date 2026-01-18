import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { contestsManager, nodeCounterManager } from '@main/startup/instances';
import { Contest } from '@common/schemas/contests';

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
