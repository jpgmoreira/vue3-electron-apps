import { ProfileManager } from '@main/managers/profileManager';
import { WindowManager } from '@main/managers/windowManager';
import { OjMetaManager } from '@main/managers/ojMetaManager';
import { UIManager } from '@main/managers/uiManager';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { OjContextManager } from '@main/managers/ojContextManager';
import { CacheManager } from '@main/managers/cache/cacheManager';
import { OjPoolManager } from '@main/managers/ojPoolManager';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const ojMetaManager = new OjMetaManager();
export const cacheManager = new CacheManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const ojContexManager = new OjContextManager(emitter);
export const ojPoolManager = new OjPoolManager(emitter, cacheManager, ojContexManager);
