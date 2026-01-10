import { GraphRecord } from '@common/schemas/graph';
import { GraphManager } from '../managers/graphManager';
import { OjMetaManager } from '../managers/ojMetaManager';
import { ProfileManager } from '../managers/profileManager';
import { HistoryManager } from '../managers/historyManager';
import { StartupData } from '@common/schemas/startup';
import { CacheManager } from '../managers/cacheManager';
import { ExplorerManager } from '@interapp/components/Explorer/main/explorerManager';
import { ContestsManager } from '../managers/contestsManager';
import { DATA_DIR } from '@main/constants';
import path from 'path';
import { Node } from '@interapp/components/Explorer/common/tree';

export async function loadStartupData(): Promise<StartupData> {
  await CacheManager.instance.loadCache();
  const ojMeta = OjMetaManager.instance.getAllMeta();
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let graphData: GraphRecord[] = [];
  if (currProfile) {
    ContestsManager.instance.loadProfile(currProfile.id);
    await GraphManager.instance.loadGraph(currProfile.id);
    graphData = await GraphManager.instance.getGraphData();
    await HistoryManager.instance.loadHistory(currProfile.id);
    const treePath = path.join(DATA_DIR, 'profileData', currProfile.id, 'tree.json');
    ExplorerManager.instance.loadTree(treePath);
    ExplorerManager.instance.registerDeleteCallback(async (node: Node) => {
      if (node.type === 'file') ContestsManager.instance.deleteContest(node.id);
    });
  }
  const result = {
    ojMeta,
    currProfile,
    profileRegistry,
    graphData,
  };
  return result;
}
