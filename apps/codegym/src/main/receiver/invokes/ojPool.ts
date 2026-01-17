import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { ojPoolManager } from '@main/startup/instances';
import { Oj } from '@common/schemas/oj';

ipcMain.handle(InvokeChannels.getOjProblem, (_: IpcMainInvokeEvent, oj: Oj) => {
  return ojPoolManager.getOjProblem(oj);
});
