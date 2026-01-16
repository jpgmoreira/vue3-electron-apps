import { StartupData } from '@common/schemas/startup';
import { profileManager, ojMetaManager } from './instances';

export async function loadStartupData(): Promise<StartupData> {
  const ojMeta = ojMetaManager.getOjMeta();
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  return {
    currProfile,
    profileRegistry,
    ojMeta,
  };
}
