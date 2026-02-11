import { APP_NAME } from '@common/constants';
import { StartupData } from '@common/schemas/startup';
import { CommonEvents } from '@interapp/events/commonEvents';
import { OnChannels } from '@preload/channels/on';
import { router } from '@renderer/router/router';
import { eventEmitter } from '@renderer/events/emitter';

window.api.on(OnChannels.loadStartupData, (data: StartupData) => {
  eventEmitter.emit(CommonEvents.loadInitialData, data);
  document.documentElement.classList.add('theme-dark');
  if (!data.currProfile) {
    document.title = APP_NAME;
    return router.replace('/login');
  }
  document.title = `${data.currProfile.name}@${APP_NAME}`;
  if (!data.ui) throw new Error('UI settings not set!');
  return router.replace(data.ui.page);
});
