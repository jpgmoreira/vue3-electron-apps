import { Profile, ProfileRegistry } from './profile';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
};
