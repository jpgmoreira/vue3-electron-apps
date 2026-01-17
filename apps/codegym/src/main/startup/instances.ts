import { ProfileManager } from '@main/managers/profileManager';
import { WindowManager } from '@main/managers/windowManager';
import { OjMetaManager } from '@main/managers/ojMetaManager';
import { UIManager } from '@main/managers/uiManager';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { OjContextManager } from '@main/managers/ojContextManager';
import { CacheManager } from '@main/managers/cache/cacheManager';
import { OjPoolManager } from '@main/managers/ojPoolManager';
import { HistoryManager } from '@main/managers/history/historyManager';
import { GraphManager } from '@main/managers/graph/graphManager';
import { NodeCounterManager } from '@main/managers/nodeCounterManager';
import { ContestsManager } from '@main/managers/contestsManager';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const ojMetaManager = new OjMetaManager();
export const cacheManager = new CacheManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const ojContexManager = new OjContextManager(emitter);
export const historyManager = new HistoryManager(emitter);
export const graphManager = new GraphManager(emitter);
export const nodeCounterManager = new NodeCounterManager(emitter);
export const contestsManager = new ContestsManager(emitter, nodeCounterManager);
export const ojPoolManager = new OjPoolManager(
  emitter,
  cacheManager,
  ojContexManager,
  historyManager
);
