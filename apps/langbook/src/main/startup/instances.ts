import { ProfileManager } from '@main/managers/profileManager';
import { WindowManager } from '@main/managers/windowManager';
import { UIManager } from '@main/managers/uiManager';
import { EventEmitter } from '@interapp/events/eventEmitter';
import { NodeCounterManager } from '@main/managers/nodeCounterManager';
import { SessionsManager } from '@main/managers/sessionsManager';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const nodeCounterManager = new NodeCounterManager(emitter);
export const sessionsManager = new SessionsManager(emitter);
