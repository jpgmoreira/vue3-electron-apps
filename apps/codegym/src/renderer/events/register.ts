import { useProfileStore } from '@renderer/store/profile';
import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useOjMetaStore } from '@renderer/store/ojMeta';
import { useUIStore } from '@renderer/store/ui';
import { useOjContextStore } from '@renderer/store/ojContext';
import { useGraphStore } from '@renderer/store/graph';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useOjMetaStore().initFromStartupData(data);
  useUIStore().initFromStartupData(data);
  useOjContextStore().initFromStartupData(data);
  useGraphStore().initFromStartupData(data);
});

eventEmitter.on(CommonEvents.clearProfileData, () => {
  useUIStore().clear();
  useOjContextStore().clear();
  useGraphStore().clear();
});
