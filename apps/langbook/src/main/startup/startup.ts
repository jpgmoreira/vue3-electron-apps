import { StartupData } from '@common/schemas/startup';
import {
  profileManager,
  uiManager,
  nodeCounterManager,
  sessionsManager,
  filtersManager,
  tagsManager,
} from './instances';
import { UISettings } from '@common/schemas/ui';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { Node } from '@interapp/components/Explorer/common/tree';
import { Filters } from '@common/schemas/filters';
import { TagsMap } from '@common/schemas/tags';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  let filters: Filters | null = null;
  let tags: TagsMap | null = null;
  if (currProfile) {
    uiManager.loadProfile(currProfile.id);
    nodeCounterManager.loadProfile(currProfile.id);
    sessionsManager.loadProfile(currProfile.id);
    filtersManager.loadProfile(currProfile.id);
    const treePath = path.join(DATA_DIR, 'profileData', currProfile.id, 'tree.json');
    explorerManager.loadTree(treePath);
    explorerManager.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') {
        // TODO: delete callback here.
      }
    });
    ui = uiManager.getUISettings();
    filters = filtersManager.getFilters();
    tags = tagsManager.getTags();
  }
  return {
    currProfile,
    profileRegistry,
    ui,
    filters,
    tags,
  };
}
