import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { profileManager } from '@main/startup/instances';
import { loadStartupData } from '@main/startup/startup';

ipcMain.handle(
  InvokeChannels.createProfile,
  async (_: IpcMainInvokeEvent, name: string): Promise<AuthResponseDTO> => {
    const result = profileManager.createProfile(name);
    if (result.status === 'error') {
      return result as AuthResponseDTO;
    }
    const data = await loadStartupData();
    return {
      status: 'success',
      data,
    };
  }
);
