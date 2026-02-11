import { StartupData } from '@common/schemas/startup';
import { profileManager, uiManager } from './instances';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { Node } from '@interapp/components/Explorer/common/tree';
import { DATA_DIR } from '@main/constants';
import path from 'path';
import { UISettings } from '@common/schemas/ui';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  if (currProfile) {
    const profileDir = path.resolve(DATA_DIR, 'profileData', currProfile.id);
    // The order of initialization below is important.
    uiManager.loadProfile(currProfile.id);
    const treePath = path.join(profileDir, 'tree.json');
    explorerManager.loadTree(treePath);
    explorerManager.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') {
        // TODO: Note delete callback here.
      }
    });
    ui = uiManager.getUISettings();
  }
  return {
    currProfile,
    profileRegistry,
    ui,
  };
}
