import { StartupData } from '@common/schemas/startup';
import {
  profileManager,
  uiManager,
  nodeCounterManager,
  sessionsManager,
  filtersManager,
  tagsManager,
  cardsManager,
} from './instances';
import { UISettings } from '@common/schemas/ui';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { Node } from '@interapp/components/Explorer/common/tree';
import { Filters } from '@common/schemas/filters';
import { TagsMap } from '@common/schemas/tags';
import { SessionsMap } from '@common/schemas/session';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  let filters: Filters | null = null;
  let tags: TagsMap | null = null;
  let sessions: SessionsMap | null = null;
  let mediaDir: string | null = null;
  if (currProfile) {
    const profileDir = path.resolve(DATA_DIR, 'profileData', currProfile.id);
    // The order of initialization below is important.
    uiManager.loadProfile(currProfile.id);
    nodeCounterManager.loadProfile(currProfile.id);
    sessionsManager.loadProfile(currProfile.id);
    filtersManager.loadProfile(currProfile.id);
    tagsManager.loadProfile(currProfile.id);
    const treePath = path.join(profileDir, 'tree.json');
    explorerManager.loadTree(treePath);
    explorerManager.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') {
        // TODO: delete callback here.
      }
    });
    await cardsManager.loadProfile(currProfile.id);
    ui = uiManager.getUISettings();
    filters = filtersManager.getFilters();
    tags = tagsManager.getTags();
    sessions = sessionsManager.getSessionsMap();
    mediaDir = path.resolve(profileDir, 'media');
  }
  return {
    currProfile,
    profileRegistry,
    ui,
    filters,
    tags,
    sessions,
    mediaDir,
  };
}
