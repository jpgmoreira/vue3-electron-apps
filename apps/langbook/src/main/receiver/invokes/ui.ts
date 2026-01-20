import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { uiManager } from '@main/startup/instances';
import { UISettings } from '@common/schemas/ui';

ipcMain.handle(
  InvokeChannels.updateUISettings,
  (_: IpcMainInvokeEvent, settings: Partial<UISettings>) => {
    uiManager.setUISettings(settings);
  }
);
