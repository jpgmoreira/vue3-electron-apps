import { Channels } from '@common/types/channels';
import { StartupData } from '@common/schemas/startup';
import { router } from '@renderer/router/router';
import { EventEmitter } from '@common/helpers/eventEmitter';
import { Events } from '@renderer/events/events';
import { APP_NAME } from '@common/constants';

window.api.on(Channels.loadStartupData, (data: StartupData) => {
  EventEmitter.instance.emit(Events.loadInitialData, data);
  document.documentElement.classList.add('theme-dark');
  if (!data.currProfile) {
    document.title = APP_NAME;
    if (data.profileRegistry.profileRecords.length === 0) {
      return router.replace('/signup');
    }
    return router.replace('/login');
  }
  document.title = `${data.currProfile.name}@${APP_NAME}`;
  return router.replace(data.currProfile.page);
});
