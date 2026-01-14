import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { profileManager } from '@main/startup/instances';
import { loadStartupData } from '@main/startup/startup';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { sleep } from '@interapp/utils/utils';

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

ipcMain.handle(
  InvokeChannels.renameProfile,
  async (
    _: IpcMainInvokeEvent,
    profileId: string,
    newName: string
  ): Promise<GenericResponseDTO> => {
    return profileManager.renameProfile(profileId, newName);
  }
);

ipcMain.handle(
  InvokeChannels.deleteProfile,
  async (_: IpcMainInvokeEvent, profileId: string): Promise<GenericResponseDTO> => {
    await sleep(1000);
    return profileManager.deleteProfile(profileId);
  }
);
