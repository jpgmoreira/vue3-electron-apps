import { StartupData } from '@common/schemas/startup';
import {
  profileManager,
  ojMetaManager,
  uiManager,
  ojContexManager,
  cacheManager,
  historyManager,
  graphManager,
  nodeCounterManager,
  contestsManager,
} from './instances';
import { UISettings } from '@common/schemas/ui';
import { OjContext } from '@common/schemas/ojContext';
import { GraphRecord } from '@common/schemas/graph';
import path from 'path';
import { DATA_DIR } from '@main/constants';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { Node } from '@interapp/components/Explorer/common/tree';

export async function loadStartupData(): Promise<StartupData> {
  await cacheManager.loadCache();
  const ojMeta = ojMetaManager.getOjMeta();
  const currProfile = profileManager.getCurrProfile();
  const profileRegistry = profileManager.getProfileRegistry();
  let ui: UISettings | null = null;
  let ojContext: OjContext | null = null;
  let graphData: GraphRecord[] = [];
  if (currProfile) {
    uiManager.loadProfile(currProfile.id);
    ojContexManager.loadProfile(currProfile.id);
    nodeCounterManager.loadProfile(currProfile.id);
    contestsManager.loadProfile(currProfile.id);
    await historyManager.loadHistory(currProfile.id);
    await graphManager.loadGraph(currProfile.id);
    const treePath = path.join(DATA_DIR, 'profileData', currProfile.id, 'tree.json');
    explorerManager.loadTree(treePath);
    explorerManager.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') {
        contestsManager.deleteContest(node.id);
      }
    });
    ui = uiManager.getUISettings();
    ojContext = ojContexManager.getContext();
    graphData = await graphManager.getGraphData();
  }
  return {
    currProfile,
    profileRegistry,
    ojMeta,
    ojContext,
    ui,
    graphData,
  };
}
