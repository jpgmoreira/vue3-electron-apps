import { ProfileManager } from '@main/managers/profileManager';
import { WindowManager } from '@main/managers/windowManager';
import { OjMetaManager } from '@main/managers/ojMetaManager';
import { EventEmitter } from '@interapp/events/eventEmitter';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const profileManager = new ProfileManager(emitter);
export const ojMetaManager = new OjMetaManager();
