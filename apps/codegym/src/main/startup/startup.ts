import { StartupData } from '@common/schemas/startup';
import {
  profileManager,
  ojMetaManager,
  uiManager,
  ojContexManager,
  cacheManager,
  historyManager,
} from './instances';
import { UISettings } from '@common/schemas/ui';
import { OjContext } from '@common/schemas/ojContext';

export async function loadStartupData(): Promise<StartupData> {
  await cacheManager.loadCache();
  const ojMeta = ojMetaManager.getOjMeta();
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  let ojContext: OjContext | null = null;
  if (currProfile) {
    uiManager.loadProfile(currProfile.id);
    ojContexManager.loadProfile(currProfile.id);
    await historyManager.loadHistory(currProfile.id);
    ui = uiManager.getUISettings();
    ojContext = ojContexManager.getContext();
  }
  return {
    currProfile,
    profileRegistry,
    ojMeta,
    ojContext,
    ui,
  };
}
