import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { Oj } from '@common/schemas/oj';
import { cacheManager } from '@main/startup/instances';
import { UpdateCacheResponseDTO } from '@common/dto/updateCacheResponseDTO';

ipcMain.handle(
  InvokeChannels.updateOjCache,
  async <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<UpdateCacheResponseDTO<T>> => {
    return cacheManager.updateOjCache(oj);
  }
);
