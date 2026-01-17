import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { Oj } from '@common/schemas/oj';
import { OjContext } from '@common/schemas/ojContext';
import { ojContexManager, ojPoolManager } from '@main/startup/instances';
import { historyManager } from '@main/startup/instances';
import { OjProblem } from '@common/schemas/problems';

ipcMain.handle(
  InvokeChannels.updateOjContext,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T, context: OjContext[T]) => {
    ojContexManager.updateOjContext(oj, context);
    ojPoolManager.setDirty(oj);
  }
);

ipcMain.handle(InvokeChannels.updateSnapshot, (_: IpcMainInvokeEvent, snapshot: OjProblem[Oj]) => {
  ojContexManager.updateSnapshot(snapshot);
  historyManager.replaceHistorySnapshot(snapshot);
});
