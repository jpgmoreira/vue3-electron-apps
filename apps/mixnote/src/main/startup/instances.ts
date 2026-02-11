import { EventEmitter } from '@interapp/events/eventEmitter';
import { GraphManager } from '@main/managers/graphManager';
import { ProfileManager } from '@main/managers/profileManager';
import { UIManager } from '@main/managers/uiManager';
import { WindowManager } from '@main/managers/windowManager';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const graphManager = new GraphManager(emitter);
