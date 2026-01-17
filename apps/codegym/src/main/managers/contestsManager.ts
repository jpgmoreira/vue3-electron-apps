import { DATA_DIR } from '@main/constants';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import path from 'path';
import { ensureDirExists } from '@interapp/utils/fileUtils';
import { buildId } from '@interapp/utils/utils';
import { Contest, getEmptyContest } from '@common/schemas/contests';
import { FileProxy } from '@interapp/utils/fileProxy';

export class ContestsManager {
  private profileId: string | null = null;

  constructor(emitter: EventEmitter) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
  }

  public loadProfile(profileId: string) {
    this.profileId = profileId;
    const contestsDir = path.join(DATA_DIR, 'profileData', profileId, 'contests');
    ensureDirExists(contestsDir);
  }

  public createContest(name: string): Contest {
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
    return contest;
  }

  public clear() {
    this.profileId = null;
  }
}
