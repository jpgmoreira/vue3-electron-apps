import { useProfileStore } from '@renderer/store/profile';
import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useOjMetaStore } from '@renderer/store/ojMeta';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useOjMetaStore().initFromStartupData(data);
});
