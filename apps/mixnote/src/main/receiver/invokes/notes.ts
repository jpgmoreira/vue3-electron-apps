import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { nodeCounterManager, notesManager, profileManager } from '@main/startup/instances';
import { Note } from '@common/schemas/notes';
import { Statistics } from '@common/schemas/statistics';

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

ipcMain.handle(InvokeChannels.updateNote, async (_: IpcMainInvokeEvent, note: Note) => {
  await notesManager.updateNote(note);
});

ipcMain.handle(InvokeChannels.getStatistics, (_: IpcMainInvokeEvent): Statistics => {
  return notesManager.getStatistics();
});

ipcMain.handle(InvokeChannels.recomputeQueues, (_: IpcMainInvokeEvent) => {
  notesManager.recomputeQueues();
});

ipcMain.handle(
  InvokeChannels.getFlashcard,
  (_: IpcMainInvokeEvent, noteId: string | null): Promise<Note | null> => {
    return notesManager.getFlashcard(noteId);
  }
);
