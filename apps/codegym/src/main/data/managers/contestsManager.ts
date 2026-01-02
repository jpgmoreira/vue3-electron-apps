import { DATA_DIR } from '../constants';
import {
  Contest,
  ContestProblem,
  ContestProblemFlag,
  getEmptyContest,
  getEmptyContestProblem,
} from '@common/schemas/contests';
import { ensureDirExists } from '../utils';
import { FileProxy } from '../fileProxy';
import { buildId } from '@common/utils/utils';
import path from 'path';
import fs from 'fs';
import { GraphManager } from './graphManager';
import { getTodayDate } from '@common/utils/dateUtils';

/**
 * Singleton for managing contests.
 * Access via ContestsManager.instance
 */
export class ContestsManager {
  static #instance: ContestsManager;
  private proxy: FileProxy<Contest> | null = null;

  private profileId: string | null = null;

  private constructor() {}

  public static get instance(): ContestsManager {
    if (!this.#instance) {
      this.#instance = new ContestsManager();
    }
    return this.#instance;
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const contestsDir = path.join(DATA_DIR, 'profileData', profileId, 'contests');
    ensureDirExists(contestsDir);
  }

  public getContest(contestId: string): Contest | null {
    if (!this.profileId) return null;
    const contestPath = path.join(
      DATA_DIR,
      'profileData',
      this.profileId,
      'contests',
      `${contestId}.json`
    );
    if (!fs.existsSync(contestPath)) {
      // Contest was deleted.
      return null;
    }
    this.proxy = new FileProxy(contestPath, getEmptyContest(contestId, '', 0));
    return this.proxy.target;
  }

  public createContest(name: string): string {
    name = name.trim();
    const now = Date.now();
    const id = buildId(name, now);
    const contest = getEmptyContest(id, name, now);
    const contestPath = path.join(
      DATA_DIR,
      'profileData',
      this.profileId!,
      'contests',
      `${id}.json`
    );
    // We do not set a contest as active upon creation.
    new FileProxy(contestPath, contest);
    return id;
  }

  public renameContest(contestId: string, newName: string) {
    newName = newName.trim();
    if (contestId === this.proxy?.proxy.id) {
      this.proxy.proxy.name = newName;
      return;
    }
    const contestPath = path.join(
      DATA_DIR,
      'profileData',
      this.profileId!,
      'contests',
      `${contestId}.json`
    );
    const fp = new FileProxy(contestPath, getEmptyContest(contestId, newName, 0));
    fp.proxy.name = newName;
  }

  public deleteContest(contestId: string) {
    if (this.proxy?.proxy.id === contestId) {
      this.proxy = null;
    }
    const contestPath = path.join(
      DATA_DIR,
      'profileData',
      this.profileId!,
      'contests',
      `${contestId}.json`
    );
    fs.unlinkSync(contestPath);
  }

  public addCurrContestProblem(): ContestProblem {
    const newProblem = getEmptyContestProblem();
    this.proxy?.proxy.problems.push(newProblem);
    return newProblem;
  }

  public updateCurrContestNotes(notes: string) {
    if (!this.proxy) return;
    this.proxy.proxy.notes = notes;
  }

  public updateCurrContestProblem(problem: ContestProblem) {
    /**
     * This method is used only for updating problem text fields.
     * For toggling flags, use "toggleCurrContestProblemFlag".
     */
    if (!this.proxy) return;
    const problemToUpdate = this.proxy.proxy.problems.find((p) => p.id === problem.id);
    if (!problemToUpdate) return;
    Object.assign(problemToUpdate, problem);
  }

  public getCurrContest() {
    if (!this.proxy) return null;
    return this.proxy.target;
  }

  public toggleCurrContestProblemFlag(problemId: string, flag: ContestProblemFlag) {
    const problem = this.proxy?.proxy.problems.find((p) => p.id === problemId);
    if (!problem) return;
    problem[flag] = !problem[flag];
    if (flag === 'solved') {
      const prevDate = problem.solvedDate;
      const today = getTodayDate();
      if (problem.solved) {
        problem.solvedDate = today;
        GraphManager.instance.updateGraph('contests', today, 1);
      } else {
        problem.solvedDate = null;
        if (prevDate === today) {
          // I only unmark a problem as "solved" if it was last solved today.
          // This is because I want to avoid this: The person solved a contest's problem,
          //   then in the future unmark all problems from the contest, to solve it again.
          //   -> There is no sense on removing old data from the graph in this case!
          GraphManager.instance.updateGraph('contests', today, -1);
        }
      }
    }
  }

  public deleteCurrContestProblem(problemId: string) {
    if (!this.proxy) return;
    this.proxy.proxy.problems = this.proxy.proxy.problems.filter((p) => p.id !== problemId);
  }
}
