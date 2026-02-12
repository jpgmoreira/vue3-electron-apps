import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useProfileStore } from '@renderer/store/profile';
import { useGraphStore } from '@renderer/store/graph';
import { useTabsStore } from '@renderer/store/tabs';
import { useUIStore } from '@renderer/store/uiStore';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useGraphStore().initFromStartupData(data);
  useTabsStore().initFromStartupData(data);
  useUIStore().initFromStartupData(data);
});

eventEmitter.on(CommonEvents.clearProfileData, () => {
  useGraphStore().clear();
  useTabsStore().clear();
  useUIStore().clear();
});
