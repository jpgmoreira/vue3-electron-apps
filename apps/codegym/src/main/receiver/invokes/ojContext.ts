import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { Oj } from '@common/schemas/oj';
import { OjContext } from '@common/schemas/ojContext';
import { ojContexManager } from '@main/startup/instances';

ipcMain.handle(
  InvokeChannels.updateOjContext,
  async <T extends Oj>(_: IpcMainInvokeEvent, oj: T, context: OjContext[T]) => {
    ojContexManager.updateOjContext(oj, context);
  }
);
