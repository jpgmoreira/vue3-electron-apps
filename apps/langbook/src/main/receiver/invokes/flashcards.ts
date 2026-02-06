import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { cardsManager } from '@main/startup/instances';
import { Card } from '@common/schemas/card';

ipcMain.handle(
  InvokeChannels.getFlashcard,
  async (_: IpcMainInvokeEvent, id: string | null): Promise<Card | null> => {
    return await cardsManager.getFlashcard(id);
  }
);
