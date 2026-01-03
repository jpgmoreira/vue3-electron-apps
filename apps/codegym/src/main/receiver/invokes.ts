import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { ProfileManager } from '@main/managers/profileManager';
import { CacheManager } from '@main/managers/cacheManager';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjPoolManager } from '@main/managers/ojPoolManager';
import { StartupData } from '@common/schemas/startup';
import { loadStartupData } from '@main/data/startup';
import { HistoryManager } from '@main/managers/historyManager';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import { Contest, ContestProblem, ContestProblemFlag } from '@common/schemas/contests';
import { ContestsManager } from '@main/managers/contestsManager';
import { AuthPage } from '@common/types/authPage';
import { GraphManager } from '@main/managers/graphManager';
import { OjContext } from '@common/schemas/ojContext';
import { OjProblem } from '@common/schemas/problems';

ipcMain.handle(
  InvokeChannels.createProfile,
  async (_, name: string): Promise<CreateProfileResponseDTO> => {
    const result = ProfileManager.instance.createProfile(name);
    if (result.status === 'error') {
      return result;
    }
    const data = await loadStartupData();
    return {
      status: 'success',
      data,
    };
  }
);

ipcMain.handle(InvokeChannels.login, (_, profileId: string): Promise<StartupData> => {
  ProfileManager.instance.loadProfile(profileId);
  return loadStartupData();
});

ipcMain.handle(
  InvokeChannels.updateOjCache,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<OjMeta[T]> =>
    CacheManager.instance.updateOjCache(oj)
);

ipcMain.handle(
  InvokeChannels.getOjProblem,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<GetOjProblemResponseDTO<T>> =>
    OjPoolManager.instance.getOjProblem(oj)
);

ipcMain.handle(
  InvokeChannels.fetchHistoryPage,
  <T extends Oj>(
    _: IpcMainInvokeEvent,
    oj: T,
    top: number
  ): Promise<FetchHistoryPageResponseDTO<T>> => HistoryManager.instance.fetchHistoryPage(oj, top)
);

ipcMain.handle(
  InvokeChannels.renameCurrProfile,
  async (_, newName: string): Promise<GenericResponseDTO> =>
    ProfileManager.instance.renameCurrProfile(newName)
);

ipcMain.handle(InvokeChannels.getContest, async (_, contestId: string): Promise<Contest | null> => {
  const contest = ContestsManager.instance.getContest(contestId);
  ProfileManager.instance.setCurrContest(contestId);
  return contest;
});

ipcMain.handle(InvokeChannels.addCurrContestProblem, async (): Promise<ContestProblem> => {
  const problem = ContestsManager.instance.addCurrContestProblem();
  return problem;
});

ipcMain.handle(
  InvokeChannels.toggleCurrContestProblemFlag,
  (_, problemId: string, flag: ContestProblemFlag) => {
    ContestsManager.instance.toggleCurrContestProblemFlag(problemId, flag);
  }
);

ipcMain.handle(InvokeChannels.deleteCurrContestProblem, (_, problemId: string) => {
  const currContest = ContestsManager.instance.getCurrContest();
  if (!currContest) return;
  ContestsManager.instance.deleteCurrContestProblem(problemId);
});

ipcMain.handle(InvokeChannels.updateCurrOj, (_, newOj: Oj) =>
  ProfileManager.instance.updateCurrOj(newOj)
);

ipcMain.on(InvokeChannels.updateCurrPage, (_, newPage: AuthPage) =>
  ProfileManager.instance.updateCurrPage(newPage)
);

ipcMain.on(InvokeChannels.setCurrSnapshotSolvedDate, (_, date: number | null) => {
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
  InvokeChannels.updateOjFilters,
  <T extends Oj>(_: Electron.IpcMainEvent, oj: T, filters: OjContext[T]['filters']) => {
    ProfileManager.instance.updateOjFilters(oj, filters);
    OjPoolManager.instance.setDirty(oj);
  }
);

ipcMain.on(InvokeChannels.setCurrOjSnapshot, (_, snapshot: OjProblem[Oj]) =>
  ProfileManager.instance.setCurrOjSnapshot(snapshot)
);

ipcMain.on(InvokeChannels.logout, ProfileManager.instance.logout.bind(ProfileManager.instance));

ipcMain.on(
  InvokeChannels.deleteCurrProfile,
  ProfileManager.instance.deleteCurrProfile.bind(ProfileManager.instance)
);

ipcMain.on(InvokeChannels.updateCurrContestNotes, (_, notes: string) =>
  ContestsManager.instance.updateCurrContestNotes(notes)
);

ipcMain.on(InvokeChannels.updateCurrContestProblem, (_, problem: ContestProblem) =>
  ContestsManager.instance.updateCurrContestProblem(problem)
);
