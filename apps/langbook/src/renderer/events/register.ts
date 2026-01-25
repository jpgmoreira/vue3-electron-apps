import { useProfileStore } from '@renderer/store/profile';
import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useUIStore } from '@renderer/store/ui';
import { useFiltersStore } from '@renderer/store/filters';
import { useSessionsStore } from '@renderer/store/sessions';
import { useTagsStore } from '@renderer/store/tags';
import { useMediaStore } from '@renderer/store/media';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useFiltersStore().initFromStartupData(data);
  useUIStore().initFromStartupData(data);
  useSessionsStore().initFromStartupData(data);
  useTagsStore().initFromStartupData(data);
  useMediaStore().initFromStartupData(data);
});

eventEmitter.on(CommonEvents.clearProfileData, () => {
  useUIStore().clear();
  useFiltersStore().clear();
  useTagsStore().clear();
  useSessionsStore().clear();
  useMediaStore().clear();
});
