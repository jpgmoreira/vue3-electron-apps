import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { filtersManager } from '@main/startup/instances';
import { cardsManager } from '@main/startup/instances';
import { Filters } from '@common/schemas/filters';

ipcMain.handle(InvokeChannels.updateFilters, (_: IpcMainInvokeEvent, filters: Partial<Filters>) => {
  filtersManager.updateFilters(filters);
  cardsManager.filter();
});
