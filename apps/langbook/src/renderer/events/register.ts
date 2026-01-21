import { useProfileStore } from '@renderer/store/profile';
import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useUIStore } from '@renderer/store/ui';
import { useFiltersStore } from '@renderer/store/filters';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useFiltersStore().initFromStartupData(data);
  useUIStore().initFromStartupData(data);
});

eventEmitter.on(CommonEvents.clearProfileData, () => {
  useUIStore().clear();
  useFiltersStore().clear();
});
