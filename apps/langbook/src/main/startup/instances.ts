import { ProfileManager } from '@main/managers/profileManager';
import { WindowManager } from '@main/managers/windowManager';
import { UIManager } from '@main/managers/uiManager';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { NodeCounterManager } from '@main/managers/nodeCounterManager';
import { SessionsManager } from '@main/managers/sessionsManager';
import { FiltersManager } from '@main/managers/filtersManager';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';
import { TagsManager } from '@main/managers/tagsManager';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const nodeCounterManager = new NodeCounterManager(emitter);
export const sessionsManager = new SessionsManager(emitter);
export const filtersManager = new FiltersManager(emitter, explorerManager);
export const tagsManager = new TagsManager(emitter, filtersManager);
