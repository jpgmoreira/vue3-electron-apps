import { TreeChannels } from './channels';

export interface ExplorerAPI {
  invoke: <T = void>(channel: TreeChannels, ...data: any[]) => Promise<T>;
}
