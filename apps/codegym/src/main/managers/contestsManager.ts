import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { buildId } from '@interapp/utils/utils';
import { Contest, getEmptyContest } from '@common/schemas/contests';
import { FileProxy } from '@interapp/utils/fileProxy';
import { NodeCounterManager } from './nodeCounterManager';
import fs from 'fs';

export class ContestsManager {
  private profileId: string | null = null;
  private counter: NodeCounterManager;

  constructor(emitter: EventEmitter, counter: NodeCounterManager) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
    this.counter = counter;
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
    const contestPath = this.buildContestPath(contestId);
    const contest = JSON.parse(fs.readFileSync(contestPath, 'utf-8')) as Contest;
    return contest;
  }

  public renameContest(contestId: string, newName: string) {
    newName = newName.trim();
    const contestPath = this.buildContestPath(contestId);
    const fp = new FileProxy(contestPath, getEmptyContest(contestId, newName, 0));
    fp.proxy.name = newName;
  }

  public deleteContest(contestId: string) {
    const contestPath = this.buildContestPath(contestId);
    fs.unlinkSync(contestPath);
  }

  public contestExists(contestId: string): boolean {
    const contestPath = this.buildContestPath(contestId);
    return fs.existsSync(contestPath);
  }

  public clear() {
    this.profileId = null;
  }
}
