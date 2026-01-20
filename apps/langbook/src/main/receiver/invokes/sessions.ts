import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { nodeCounterManager, sessionsManager, profileManager } from '@main/startup/instances';
import { Session } from '@common/schemas/session';

ipcMain.handle(InvokeChannels.createFolder, (_: IpcMainInvokeEvent): number => {
  const number = nodeCounterManager.getCounter().nextDir;
  nodeCounterManager.increment('dir');
  return number;
});

ipcMain.handle(InvokeChannels.createSession, (_: IpcMainInvokeEvent): Session => {
  const number = nodeCounterManager.getCounter().nextFile;
  const session = sessionsManager.createSession(number);
  nodeCounterManager.increment('file');
  profileManager.addSessions(1);
  return session;
});
