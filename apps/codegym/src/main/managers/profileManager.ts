import {
  getEmptyProfile,
  getEmptyProfileRegistry,
  Profile,
  ProfileRecord,
  ProfileRegistry,
} from '@common/schemas/profile';
import { FileProxy } from '@interapp/utils/fileProxy';
import path from 'path';
import { DATA_DIR } from '@common/constants';
import { Oj } from '@common/types/oj';
import { AuthPage } from '@common/types/authPage';
import { buildId } from '@interapp/utils/utils';
import { OjContext } from '@common/schemas/ojContext';
import { OjProblem } from '@common/schemas/problems';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import fs from 'fs';

EventEmitter.instance.on(CommonEvents.clearProfileData, () => {
  ProfileManager.instance.clear();
});

export class ProfileManager {
  static #instance: ProfileManager;

  private currProfileProxy: FileProxy<Profile> | null = null;
  private registryProxy: FileProxy<ProfileRegistry> | null = null;

  private constructor() {
    const registryPath = path.join(DATA_DIR, 'profiles.json');
    this.registryProxy = new FileProxy(registryPath, getEmptyProfileRegistry());
    const profileId = this.registryProxy!.proxy.currProfileId;
    if (profileId) this.loadProfile(profileId);
  }

  public static get instance(): ProfileManager {
    if (!this.#instance) {
      this.#instance = new ProfileManager();
    }
    return this.#instance;
  }

  private validateProfileName(name: string) {
    if (!name) {
      return {
        status: 'error',
        errorMsg: 'Profile name cannot be empty!',
      } as const;
    }
    if (this.registryProxy!.proxy.profileRecords.some((p) => p.name === name)) {
      return {
        status: 'error',
        errorMsg: 'Profile name already in use!',
      } as const;
    }
    return { status: 'success ' } as const;
  }

  public getCurrProfile() {
    return this.currProfileProxy?.target || null;
  }

  public getProfileRegistry() {
    return this.registryProxy!.target;
  }

  private findProfileRecord(profileId: string): ProfileRecord | null {
    const records = this.registryProxy!.proxy.profileRecords;
    const record = records.find((p) => p.id === profileId);
    return record || null;
  }

  public loadProfile(profileId: string) {
    const record = this.findProfileRecord(profileId);
    if (!record) return;
    record.lastAccess = Date.now();
    const profilePath = path.join(DATA_DIR, 'profileData', profileId, 'profile.json');
    this.currProfileProxy = new FileProxy(profilePath, getEmptyProfile(record.id, record.name));
    this.registryProxy!.proxy.currProfileId = profileId;
  }

  public logout() {
    EventEmitter.instance.emit(CommonEvents.clearProfileData);
  }

  public clear() {
    this.currProfileProxy = null;
    this.registryProxy!.proxy.currProfileId = null;
  }

  public deleteProfile(profileId: string): GenericResponseDTO {
    try {
      const { profileRecords } = this.registryProxy!.proxy;
      for (let i = 0; i < profileRecords.length; i++) {
        if (profileRecords[i].id === profileId) {
          profileRecords.splice(i, 1);
          break;
        }
      }
      const dirPath = path.join(DATA_DIR, 'profileData', profileId);
      fs.rmSync(dirPath, { recursive: true, force: true });
      return { status: 'success' };
    } catch (err: unknown) {
      return {
        status: 'error',
        errorMsg: `${err}`,
      };
    }
  }

  public updateCurrOj(oj: Oj) {
    this.currProfileProxy!.proxy.currOj = oj;
  }

  public updateCurrPage(page: AuthPage) {
    this.currProfileProxy!.proxy.page = page;
  }

  public setOjContextMatched(oj: Oj, matched: number) {
    this.currProfileProxy!.proxy.ojContext[oj].matched = matched;
  }

  public setOjContextSnapshot<T extends Oj>(oj: T, snapshot: OjProblem[T]) {
    this.currProfileProxy!.proxy.ojContext[oj].snapshot = snapshot;
  }

  public setOjContextHasEverFiltered(oj: Oj, value: boolean) {
    this.currProfileProxy!.proxy.ojContext[oj].hasEverFiltered = value;
  }

  public setCurrSnapshotSolvedDate(date: number | null) {
    const currOj = this.currProfileProxy!.proxy.currOj;
    const currSnapshot = this.currProfileProxy!.proxy.ojContext[currOj].snapshot;
    currSnapshot!.solvedDate = date;
  }

  public setCurrOjSnapshot(snapshot: OjProblem[Oj]) {
    const currOj = this.currProfileProxy!.proxy.currOj;
    const ojContext = this.currProfileProxy!.proxy.ojContext[currOj];
    ojContext.snapshot = snapshot;
  }

  public renameProfile(profileId: string, newName: string): GenericResponseDTO {
    newName = newName.trim();
    const validationResult = this.validateProfileName(newName);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    const record = this.findProfileRecord(profileId);
    if (!record) {
      return {
        status: 'error',
        errorMsg: 'Profile not found!',
      };
    }
    record.name = newName;
    return {
      status: 'success',
    };
  }

  public createProfile(name: string): GenericResponseDTO {
    name = name.trim();
    const validationResult = this.validateProfileName(name);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    const now = Date.now();
    const id = buildId(name, now);
    this.registryProxy!.proxy.profileRecords.push({
      id,
      name,
      createdAt: now,
      lastAccess: now,
    });
    this.loadProfile(id);
    return { status: 'success' };
  }

  public updateOjFilters<T extends Oj>(oj: T, filters: OjContext[T]['filters']) {
    this.currProfileProxy!.proxy.ojContext[oj].filters = filters;
  }

  public setCurrContest(contestId: string | null) {
    if (!this.currProfileProxy) return;
    this.currProfileProxy.proxy.currContestId = contestId;
  }

  public contestDeleted(contestId: string) {
    if (contestId === this.currProfileProxy?.proxy.currContestId) {
      this.currProfileProxy.proxy.currContestId = null;
    }
  }
}
