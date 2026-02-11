import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { graphManager } from '@main/startup/instances';
import { GraphRecord } from '@common/schemas/graph';

ipcMain.handle(InvokeChannels.incrementGraph, (_: IpcMainInvokeEvent): Promise<GraphRecord> => {
  return graphManager.incrementTodayRecord();
});
