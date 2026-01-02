import { ipcMain } from 'electron';
import { Channels } from '@common/types/channels';
import { Oj } from '@common/types/oj';
import { AuthPage } from '@common/types/authPage';
import { ProfileManager } from '@main/data/managers/profileManager';
import { GraphManager } from '@main/data/managers/graphManager';
import { HistoryManager } from '@main/data/managers/historyManager';
import { OjContext } from '@common/schemas/ojContext';
import { OjPoolManager } from '@main/data/managers/ojPoolManager';
import { OjProblem } from '@common/schemas/problems';
import { ContestsManager } from '@main/data/managers/contestsManager';
import { ContestProblem } from '@common/schemas/contests';

ipcMain.on(Channels.updateCurrOj, (_, newOj: Oj) => ProfileManager.instance.updateCurrOj(newOj));

ipcMain.on(Channels.updateCurrPage, (_, newPage: AuthPage) =>
  ProfileManager.instance.updateCurrPage(newPage)
);

ipcMain.on(Channels.setCurrSnapshotSolvedDate, (_, date: number | null) => {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const currOj = currProfile.currOj;
  const ojContext = currProfile.ojContext[currOj];
  const snapshot = ojContext.snapshot;
  if (!snapshot) return;
  const prevSolvedDate = snapshot.solvedDate;
  if (prevSolvedDate != null) GraphManager.instance.updateGraph(currOj, prevSolvedDate, -1);
  if (date !== null) GraphManager.instance.updateGraph(currOj, date, 1);
  ProfileManager.instance.setCurrSnapshotSolvedDate(date);
  HistoryManager.instance.replaceHistorySnapshot(snapshot);
});

ipcMain.on(
  Channels.updateOjFilters,
  <T extends Oj>(_: Electron.IpcMainEvent, oj: T, filters: OjContext[T]['filters']) => {
    ProfileManager.instance.updateOjFilters(oj, filters);
    OjPoolManager.instance.setDirty(oj);
  }
);

ipcMain.on(Channels.setCurrOjSnapshot, (_, snapshot: OjProblem[Oj]) =>
  ProfileManager.instance.setCurrOjSnapshot(snapshot)
);

ipcMain.on(Channels.logout, ProfileManager.instance.logout.bind(ProfileManager.instance));

ipcMain.on(
  Channels.deleteCurrProfile,
  ProfileManager.instance.deleteCurrProfile.bind(ProfileManager.instance)
);

ipcMain.on(Channels.updateCurrContestNotes, (_, notes: string) =>
  ContestsManager.instance.updateCurrContestNotes(notes)
);

ipcMain.on(Channels.updateCurrContestProblem, (_, problem: ContestProblem) =>
  ContestsManager.instance.updateCurrContestProblem(problem)
);
