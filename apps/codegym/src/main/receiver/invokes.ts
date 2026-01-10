import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvokeChannels } from '@preload/channels/invoke';
import { AuthResponseDTO } from '@common/dto/authResponseDTO';
import { ProfileManager } from '@main/managers/profileManager';
import { CacheManager } from '@main/managers/cacheManager';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjPoolManager } from '@main/managers/ojPoolManager';
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

ipcMain.handle(InvokeChannels.createProfile, async (_, name: string): Promise<AuthResponseDTO> => {
  const result = ProfileManager.instance.createProfile(name);
  if (result.status === 'error') {
    return result;
  }
  const data = await loadStartupData();
  return {
    status: 'success',
    data,
  };
});

ipcMain.handle(InvokeChannels.login, async (_, profileId: string): Promise<AuthResponseDTO> => {
  try {
    ProfileManager.instance.loadProfile(profileId);
    return {
      status: 'success',
      data: await loadStartupData(),
    };
  } catch (err: unknown) {
    return {
      status: 'error',
      errorMsg: `${err}`,
    };
  }
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
  InvokeChannels.renameProfile,
  async (_, profileId: string, newName: string): Promise<GenericResponseDTO> =>
    ProfileManager.instance.renameProfile(profileId, newName)
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

ipcMain.handle(InvokeChannels.updateCurrPage, (_, newPage: AuthPage) =>
  ProfileManager.instance.updateCurrPage(newPage)
);

ipcMain.handle(InvokeChannels.setCurrSnapshotSolvedDate, (_, date: number | null) => {
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

ipcMain.handle(
  InvokeChannels.updateOjFilters,
  <T extends Oj>(_: Electron.IpcMainInvokeEvent, oj: T, filters: OjContext[T]['filters']) => {
    ProfileManager.instance.updateOjFilters(oj, filters);
    OjPoolManager.instance.setDirty(oj);
  }
);

ipcMain.handle(InvokeChannels.setCurrOjSnapshot, (_, snapshot: OjProblem[Oj]) =>
  ProfileManager.instance.setCurrOjSnapshot(snapshot)
);

ipcMain.handle(InvokeChannels.logout, ProfileManager.instance.logout.bind(ProfileManager.instance));

ipcMain.handle(InvokeChannels.deleteProfile, (_, profileId: string): GenericResponseDTO => {
  return ProfileManager.instance.deleteProfile(profileId);
});

ipcMain.handle(InvokeChannels.updateCurrContestNotes, (_, notes: string) =>
  ContestsManager.instance.updateCurrContestNotes(notes)
);

ipcMain.handle(InvokeChannels.updateCurrContestProblem, (_, problem: ContestProblem) =>
  ContestsManager.instance.updateCurrContestProblem(problem)
);

ipcMain.handle(InvokeChannels.createContest, (_, name: string) =>
  ContestsManager.instance.createContest(name)
);

ipcMain.handle(InvokeChannels.renameContest, (_, contestId: string, newName: string) =>
  ContestsManager.instance.renameContest(contestId, newName)
);

ipcMain.handle(InvokeChannels.deleteContest, (_, contestId: string) =>
  ContestsManager.instance.deleteContest(contestId)
);
