import { EventEmitter } from '@interapp/events/eventEmitter';
import { GraphManager } from '@main/managers/graphManager';
import { ProfileManager } from '@main/managers/profileManager';
import { UIManager } from '@main/managers/uiManager';
import { WindowManager } from '@main/managers/windowManager';
import { TabsManager } from '@main/managers/tabsManager';
import { NodeCounterManager } from '@main/managers/nodeCounterManager';
import { NotesManager } from '@main/managers/notes/notesManager';
import { NotesMediaManager } from '@main/managers/notes/media/notesMediaManager';
import { FlashcardsManager } from '@main/managers/notes/flashcardsManager';
import { SettingsManager } from '@main/managers/settingsManager';
import { explorerManager } from '@interapp/components/Explorer/main/instances/instances';

const emitter = new EventEmitter();
export const windowManager = new WindowManager();
export const profileManager = new ProfileManager(emitter);
export const uiManager = new UIManager(emitter);
export const graphManager = new GraphManager(emitter);
export const tabsManager = new TabsManager(emitter);
export const nodeCounterManager = new NodeCounterManager(emitter);

export const settingsManager = new SettingsManager(emitter);
const flashcardsManager = new FlashcardsManager(settingsManager);
const notesMediaManager = new NotesMediaManager();
export const notesManager = new NotesManager(
  emitter,
  profileManager,
  tabsManager,
  notesMediaManager,
  flashcardsManager,
  explorerManager
);
