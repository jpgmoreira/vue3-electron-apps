import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';

eventEmitter.on(CommonEvents.loadInitialData, (data: StartupData) => {});

eventEmitter.on(CommonEvents.clearProfileData, () => {});
