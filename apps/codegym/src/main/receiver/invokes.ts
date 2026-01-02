import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { Channels } from '@common/types/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { ProfileManager } from '@main/data/managers/profileManager';
import { CacheManager } from '@main/data/managers/cacheManager';
import { Oj } from '@common/types/oj';
import { OjMeta } from '@common/schemas/ojMeta';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { OjPoolManager } from '@main/data/managers/ojPoolManager';
import { StartupData } from '@common/schemas/startup';
import { loadStartupData } from '@main/data/startup';
import { HistoryManager } from '@main/data/managers/historyManager';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
import { Contest, ContestProblem, ContestProblemFlag } from '@common/schemas/contests';
import { ContestsManager } from '@main/data/managers/contestsManager';

ipcMain.handle(
  Channels.createProfile,
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

ipcMain.handle(Channels.login, (_, profileId: string): Promise<StartupData> => {
  ProfileManager.instance.loadProfile(profileId);
  return loadStartupData();
});

ipcMain.handle(
  Channels.updateOjCache,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<OjMeta[T]> =>
    CacheManager.instance.updateOjCache(oj)
);

ipcMain.handle(
  Channels.getOjProblem,
  <T extends Oj>(_: IpcMainInvokeEvent, oj: T): Promise<GetOjProblemResponseDTO<T>> =>
    OjPoolManager.instance.getOjProblem(oj)
);

ipcMain.handle(
  Channels.fetchHistoryPage,
  <T extends Oj>(
    _: IpcMainInvokeEvent,
    oj: T,
    top: number
  ): Promise<FetchHistoryPageResponseDTO<T>> => HistoryManager.instance.fetchHistoryPage(oj, top)
);

ipcMain.handle(
  Channels.renameCurrProfile,
  async (_, newName: string): Promise<GenericResponseDTO> =>
    ProfileManager.instance.renameCurrProfile(newName)
);

ipcMain.handle(Channels.getContest, async (_, contestId: string): Promise<Contest | null> => {
  const contest = ContestsManager.instance.getContest(contestId);
  ProfileManager.instance.setCurrContest(contestId);
  return contest;
});

ipcMain.handle(Channels.addCurrContestProblem, async (): Promise<ContestProblem> => {
  const problem = ContestsManager.instance.addCurrContestProblem();
  return problem;
});

ipcMain.handle(
  Channels.toggleCurrContestProblemFlag,
  (_, problemId: string, flag: ContestProblemFlag) => {
    ContestsManager.instance.toggleCurrContestProblemFlag(problemId, flag);
  }
);

ipcMain.handle(Channels.deleteCurrContestProblem, (_, problemId: string) => {
  const currContest = ContestsManager.instance.getCurrContest();
  if (!currContest) return;
  ContestsManager.instance.deleteCurrContestProblem(problemId);
});
