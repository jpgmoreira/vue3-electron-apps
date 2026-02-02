import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { cardsManager } from '@main/startup/instances';
import { Card } from '@common/schemas/card';
import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';
import { Statistics } from '@common/schemas/statistics';

ipcMain.handle(InvokeChannels.createCard, async (_: IpcMainInvokeEvent, card: Card) => {
  await cardsManager.createCard(card);
});

ipcMain.handle(
  InvokeChannels.getCardsPage,
  (_: IpcMainInvokeEvent, scrollTop: number): GetCardsPageResponseDTO => {
    return cardsManager.getCardsPage(scrollTop);
  }
);

ipcMain.handle(InvokeChannels.deleteCard, async (_: IpcMainInvokeEvent, cardId: string) => {
  await cardsManager.deleteCard(cardId);
});

ipcMain.handle(InvokeChannels.updateCard, async (_: IpcMainInvokeEvent, card: Card) => {
  await cardsManager.updateCard(card);
});

ipcMain.handle(InvokeChannels.clearFilteredBucket, async (_: IpcMainInvokeEvent) => {
  await cardsManager.clearFilteredBucket();
});

ipcMain.handle(InvokeChannels.getStatistics, (): Statistics => {
  return cardsManager.getStatistics();
});
