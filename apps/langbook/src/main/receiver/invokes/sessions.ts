import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { nodeCounterManager, sessionsManager, profileManager } from '@main/startup/instances';
import { Session, SessionsMap } from '@common/schemas/session';

ipcMain.handle(InvokeChannels.createFolder, (_: IpcMainInvokeEvent): number => {
  const number = nodeCounterManager.getCounter().nextDir;
  nodeCounterManager.increment('dir');
  return number;
});

ipcMain.handle(InvokeChannels.createSession, async (_: IpcMainInvokeEvent): Promise<Session> => {
  const number = nodeCounterManager.getCounter().nextFile;
  const session = await sessionsManager.createSession(number);
  nodeCounterManager.increment('file');
  profileManager.addSessions(1);
  return session;
});

ipcMain.handle(InvokeChannels.refetchSessions, (): SessionsMap => {
  return sessionsManager.getSessionsMap();
});
