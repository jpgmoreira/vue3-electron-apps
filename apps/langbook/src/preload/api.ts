import { InvokeChannels } from './channels/invoke';
import { OnChannels } from './channels/on';

export interface ElectronAPI {
  invoke: <T = void>(channel: InvokeChannels, ...data: any[]) => Promise<T>;
  on: (channel: OnChannels, func: (...args: any[]) => void) => void;
}
