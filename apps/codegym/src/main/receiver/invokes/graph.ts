import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { OjWithContests } from '@common/schemas/oj';
import { graphManager } from '@main/startup/instances';

ipcMain.handle(
  InvokeChannels.updateGraph,
  (_: IpcMainInvokeEvent, source: OjWithContests, date: number, value: 1 | -1) => {
    graphManager.updateGraph(source, date, value);
  }
);
