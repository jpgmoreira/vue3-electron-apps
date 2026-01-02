import {
  getEmptyProfile,
  getEmptyProfileRegistry,
  Profile,
  ProfileRegistry,
} from '@common/schemas/profile';
import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { Oj } from '@common/types/oj';
import { AuthPage } from '@common/types/authPage';
import { buildId } from '@common/utils/utils';
import { OjContext } from '@common/schemas/ojContext';
import { OjProblem } from '@common/schemas/problems';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@main/utils/events';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import fs from 'fs';

EventEmitter.instance.on(Events.clearProfileData, () => {
  ProfileManager.instance.clear();
});

/**
 * Singleton for managing profiles.
 * Access via ProfileManager.instance
 */
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

  public loadProfile(profileId: string) {
    const records = this.registryProxy!.proxy.profileRecords;
    const record = records.find((p) => p.id === profileId);
    if (!record) return;
    const profilePath = path.join(DATA_DIR, 'profileData', profileId, 'profile.json');
    this.currProfileProxy = new FileProxy(profilePath, getEmptyProfile(record.id, record.name));
    this.registryProxy!.proxy.currProfileId = profileId;
  }

  public logout() {
    EventEmitter.instance.emit(Events.clearProfileData);
  }

  public clear() {
    this.currProfileProxy = null;
    this.registryProxy!.proxy.currProfileId = null;
  }

  public deleteCurrProfile() {
    const id = this.currProfileProxy!.proxy.id;
    const { profileRecords } = this.registryProxy!.proxy;
    for (let i = 0; i < profileRecords.length; i++) {
      if (profileRecords[i].id === id) {
        profileRecords.splice(i, 1);
        break;
      }
    }
    this.logout();
    const dirPath = path.join(DATA_DIR, 'profileData', id);
    fs.rmSync(dirPath, { recursive: true, force: true });
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

  public renameCurrProfile(newName: string): GenericResponseDTO {
    newName = newName.trim();
    const validationResult = this.validateProfileName(newName);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    const { profileRecords, currProfileId } = this.registryProxy!.proxy;
    const currProfileRecord = profileRecords.find((p) => p.id === currProfileId);
    if (!currProfileRecord || !this.currProfileProxy) {
      return {
        status: 'error',
        errorMsg: 'Current profile is not valid!',
      };
    }
    currProfileRecord.name = newName;
    this.currProfileProxy.proxy.name = newName;
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
