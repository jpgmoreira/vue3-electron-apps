import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { Filters } from '@common/schemas/filters';
import { notesManager } from '@main/startup/instances';

ipcMain.handle(InvokeChannels.updateFilters, (_: IpcMainInvokeEvent, filters: Filters) => {
  return notesManager.updateFilters(filters);
});
