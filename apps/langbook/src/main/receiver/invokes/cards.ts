import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { cardsManager } from '@main/startup/instances';
import { Card } from '@common/schemas/card';

ipcMain.handle(InvokeChannels.createCard, (_: IpcMainInvokeEvent, card: Card) => {
  cardsManager.createCard(card);
});
