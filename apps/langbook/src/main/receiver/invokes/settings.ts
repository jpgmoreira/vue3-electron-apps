import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { settingsManager } from '@main/startup/instances';
import { Settings } from '@common/schemas/settings';

ipcMain.handle(InvokeChannels.updateSettings, (_: IpcMainInvokeEvent, settings: Settings) => {
  return settingsManager.update(settings);
});
