import { StartupData } from '@common/schemas/startup';
import { profileManager, ojMetaManager, uiManager } from './instances';
import { UISettings } from '@common/schemas/ui';

export async function loadStartupData(): Promise<StartupData> {
  const ojMeta = ojMetaManager.getOjMeta();
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  if (currProfile) {
    uiManager.loadProfile(currProfile.id);
    ui = uiManager.getUISettings();
  }
  return {
    currProfile,
    profileRegistry,
    ojMeta,
    ui,
  };
}
