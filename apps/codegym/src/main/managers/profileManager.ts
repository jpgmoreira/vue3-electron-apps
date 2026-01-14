import {
  getEmptyProfile,
  getEmptyProfileRegistry,
  Profile,
  ProfileRecord,
  ProfileRegistry,
} from '@common/schemas/profile';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import { FileProxy } from '@interapp/utils/fileProxy';
import { buildId } from '@interapp/utils/utils';
import { DATA_DIR } from '@main/constants';
import path from 'path';

export class ProfileManager {
  private currProfileProxy: FileProxy<Profile> | null = null;
  private registryProxy: FileProxy<ProfileRegistry> | null = null;

  constructor() {
    const registryPath = path.join(DATA_DIR, 'profiles.json');
    this.registryProxy = new FileProxy(registryPath, getEmptyProfileRegistry());
    const profileId = this.registryProxy!.proxy.currProfileId;
    if (profileId) this.loadProfile(profileId);
  }

  private findProfileRecord(profileId: string): ProfileRecord | null {
    const records = this.registryProxy!.proxy.profileRecords;
    const record = records.find((p) => p.id === profileId);
    return record || null;
  }

  public loadProfile(profileId: string) {
    const record = this.findProfileRecord(profileId);
    if (!record) throw new Error('Profile record not found!');
    record.lastAccess = Date.now();
    const profilePath = path.join(DATA_DIR, 'profileData', profileId, 'profile.json');
    this.currProfileProxy = new FileProxy(profilePath, getEmptyProfile(record.id, record.name));
    this.registryProxy!.proxy.currProfileId = profileId;
  }

  public getCurrProfile() {
    return this.currProfileProxy?.target || null;
  }

  public getProfileRegistry() {
    return this.registryProxy!.target;
  }

  private validateProfileName(name: string): GenericResponseDTO {
    if (!name) {
      return {
        status: 'error',
        message: 'Profile name cannot be empty!',
      } as const;
    }
    if (this.registryProxy!.proxy.profileRecords.some((p) => p.name === name)) {
      return {
        status: 'error',
        message: 'Profile name already in use!',
      } as const;
    }
    return { status: 'success' } as const;
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
        message: 'Profile not found!',
      };
    }
    record.name = newName;
    const fPath = path.join(DATA_DIR, 'profileData', profileId, 'profile.json');
    const profileProxy = new FileProxy(fPath, getEmptyProfile(profileId, newName));
    profileProxy.proxy.name = newName;
    return {
      status: 'success',
    };
  }
}
