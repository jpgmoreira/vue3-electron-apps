import { StartupData } from '@common/schemas/startup';
import { profileManager } from './instances';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  return {
    currProfile,
    profileRegistry,
  };
}
