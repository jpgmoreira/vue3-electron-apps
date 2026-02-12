import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { nodeCounterManager, notesManager, profileManager } from '@main/startup/instances';
import { Note } from '@common/schemas/notes';

ipcMain.handle(InvokeChannels.createFolder, (_: IpcMainInvokeEvent): number => {
  const number = nodeCounterManager.getCounter().nextDir;
  nodeCounterManager.increment('dir');
  return number;
});

ipcMain.handle(InvokeChannels.createNote, (_: IpcMainInvokeEvent): Note => {
  const number = nodeCounterManager.getCounter().nextFile;
  const name = `Note ${number}`;
  const note = notesManager.createNote(name);
  nodeCounterManager.increment('file');
  profileManager.addNotes(1);
  return note;
});

ipcMain.handle(InvokeChannels.getNote, (_: IpcMainInvokeEvent, noteId: string): Note => {
  return notesManager.getNote(noteId);
});
