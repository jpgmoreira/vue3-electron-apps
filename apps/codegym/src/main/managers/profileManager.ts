import {
  getEmptyProfile,
  getEmptyProfileRegistry,
  Profile,
  ProfileRecord,
  ProfileRegistry,
} from '@common/schemas/profile';
import { FileProxy } from '@interapp/utils/fileProxy';
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
}
