import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { tabsManager } from '@main/startup/instances';
import { TabGroup } from '@common/schemas/tabs';

ipcMain.handle(InvokeChannels.refetchTabs, (_: IpcMainInvokeEvent): TabGroup[] => {
  return tabsManager.getGroups();
});
