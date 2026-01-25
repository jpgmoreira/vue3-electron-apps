import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { cardsManager } from '@main/startup/instances';
import { Card } from '@common/schemas/card';
import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';

ipcMain.handle(InvokeChannels.createCard, async (_: IpcMainInvokeEvent, card: Card) => {
  await cardsManager.createCard(card);
});

ipcMain.handle(
  InvokeChannels.getCardsPage,
  (_: IpcMainInvokeEvent, scrollTop: number): GetCardsPageResponseDTO => {
    return cardsManager.getCardsPage(scrollTop);
  }
);
