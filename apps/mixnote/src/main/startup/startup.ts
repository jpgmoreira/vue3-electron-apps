import { StartupData } from '@common/schemas/startup';
import {
  graphManager,
  nodeCounterManager,
  notesManager,
  profileManager,
  tabsManager,
  uiManager,
} from './instances';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { Node } from '@interapp/components/Explorer/common/tree';
import { DATA_DIR } from '@main/constants';
import path from 'path';
import { UISettings } from '@common/schemas/ui';
import { GraphRecord } from '@common/schemas/graph';
import { TabGroup } from '@common/schemas/tabs';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  let graph: GraphRecord[] | null = null;
  let tabGroups: TabGroup[] | null = null;
  if (currProfile) {
    const profileDir = path.resolve(DATA_DIR, 'profileData', currProfile.id);
    // The order of initialization below is important.
    uiManager.loadProfile(currProfile.id);
    nodeCounterManager.loadProfile(currProfile.id);
    notesManager.loadProfile(currProfile.id);
    tabsManager.loadProfile(currProfile.id);
    const treePath = path.join(profileDir, 'tree.json');
    explorerManager.loadTree(treePath);
    explorerManager.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') {
        notesManager.deleteNote(node.id);
      }
    });
    ui = uiManager.getUISettings();
    graph = await graphManager.loadProfile(currProfile.id);
    tabGroups = tabsManager.getGroups();
  }
  return {
    currProfile,
    profileRegistry,
    ui,
    graph,
    tabGroups,
  };
}
