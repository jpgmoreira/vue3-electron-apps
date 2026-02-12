import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { profileManager } from '@main/startup/instances';
import { loadStartupData } from '@main/startup/startup';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { ProfileRegistry } from '@common/schemas/profile';

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
    return profileManager.deleteProfile(profileId);
  }
);

ipcMain.handle(InvokeChannels.login, async (_, profileId: string): Promise<AuthResponseDTO> => {
  try {
    profileManager.loadProfile(profileId);
    return {
      status: 'success',
      data: await loadStartupData(),
    };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: `${err}`,
    };
  }
});

ipcMain.handle(InvokeChannels.logout, async () => {
  await profileManager.logout();
});

ipcMain.handle(InvokeChannels.refetchProfile, (): ProfileRegistry => {
  return profileManager.getProfileRegistry();
});
