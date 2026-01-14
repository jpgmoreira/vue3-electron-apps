import { StartupData } from '@common/schemas/startup';
import { OnChannels } from '@preload/channels/on';

window.api.on(OnChannels.loadStartupData, (data: StartupData) => {
  console.log(data);
});
