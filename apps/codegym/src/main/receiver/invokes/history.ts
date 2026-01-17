import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { Oj } from '@common/schemas/oj';
import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import { historyManager } from '@main/startup/instances';

ipcMain.handle(
  InvokeChannels.fetchHistoryPage,
  <T extends Oj>(
    _: IpcMainInvokeEvent,
    oj: T,
    top: number
  ): Promise<FetchHistoryPageResponseDTO<T>> => {
    return historyManager.fetchHistoryPage(oj, top);
  }
);
