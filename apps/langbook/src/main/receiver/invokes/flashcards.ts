import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { cardsManager } from '@main/startup/instances';
import { Card } from '@common/schemas/card';

ipcMain.handle(
  InvokeChannels.getFlashcard,
  (_: IpcMainInvokeEvent, id: string | null): Card | null => {
    return cardsManager.getFlashcard(id);
  }
);
