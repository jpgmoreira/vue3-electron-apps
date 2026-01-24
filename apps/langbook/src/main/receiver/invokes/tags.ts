import { ipcMain } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { tagsManager } from '@main/startup/instances';
import { TagsMap } from '@common/schemas/tags';

ipcMain.handle(InvokeChannels.refetchTags, (): TagsMap => {
  return tagsManager.getTags();
});
