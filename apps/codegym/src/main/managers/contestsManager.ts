import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { buildId, deepFreeze, randomId } from '@interapp/utils/utils';
import {
  Contest,
  ContestProblem,
  getEmptyContest,
  getEmptyContestProblem,
} from '@common/schemas/contests';
import { FileProxy } from '@interapp/utils/fileProxy';
import { NodeCounterManager } from './nodeCounterManager';
import fs from 'fs';

export class ContestsManager {
  private _proxy: FileProxy<Contest> | null = null;

  private profileId: string | null = null;
  private counter: NodeCounterManager;
  private readonly dummy: Contest;

  private get proxy() {
    return this._proxy?.proxy;
  }
  private get target() {
    return this._proxy?.target;
  }

  constructor(emitter: EventEmitter, counter: NodeCounterManager) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
    this.counter = counter;
    this.dummy = deepFreeze(getEmptyContest('', '', 0));
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const contestsDir = path.join(DATA_DIR, 'profileData', profileId, 'contests');
    ensureDirExists(contestsDir);
  }

  private buildContestPath(contestId: string) {
    return path.join(DATA_DIR, 'profileData', this.profileId!, 'contests', `${contestId}.json`);
  }

  public createContest(): Contest {
    const now = Date.now();
    const number = this.counter.getCounter().nextFile;
    this.counter.increment('file');
    const name = `Contest ${number}`;
    const id = buildId(name, now);
    const contest = getEmptyContest(id, name, now);
    const contestPath = this.buildContestPath(id);
    // We do not set a contest as active upon creation.
    new FileProxy(contestPath, contest);
    return contest;
  }

  public getContest(contestId: string): Contest {
    if (this.target && this.target.id === contestId) {
      return this.target;
    }
    const contestPath = this.buildContestPath(contestId);
    this._proxy = new FileProxy(contestPath, this.dummy);
    return this.target!;
  }

  private guard(contestId: string) {
    if (this.proxy?.id !== contestId) {
      this.getContest(contestId);
    }
  }

  public renameContest(contestId: string, newName: string) {
    this.guard(contestId);
    newName = newName.trim();
    this.proxy!.name = newName;
  }

  public deleteContest(contestId: string) {
    if (this.proxy?.id === contestId) {
      this._proxy = null;
    }
    const contestPath = this.buildContestPath(contestId);
    fs.unlinkSync(contestPath);
  }

  public contestExists(contestId: string): boolean {
    const contestPath = this.buildContestPath(contestId);
    return fs.existsSync(contestPath);
  }

  public addContestProblem(contestId: string) {
    this.guard(contestId);
    const id = randomId();
    const problem = getEmptyContestProblem(id);
    this.proxy!.problems.push(problem);
    return problem;
  }

  public updateContestNotes(contestId: string, notes: string) {
    this.guard(contestId);
    this.proxy!.notes = notes;
  }

  public updateContestProblem(contestId: string, problem: ContestProblem) {
    this.guard(contestId);
    const problemToUpdate = this.proxy!.problems.find((p) => p.id === problem.id);
    if (!problemToUpdate) throw new Error('Problem not found!');
    Object.assign(problemToUpdate, problem);
  }

  public deleteContestProblem(contestId: string, problemId: string) {
    this.guard(contestId);
    this.proxy!.problems = this.proxy!.problems.filter((p) => p.id !== problemId);
  }

  public clear() {
    this.profileId = null;
    this._proxy = null;
  }
}
