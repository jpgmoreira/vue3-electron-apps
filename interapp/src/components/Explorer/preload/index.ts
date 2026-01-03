// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { type ExplorerAPI } from './api';
import { TreeChannels } from './channels';

// https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
contextBridge.exposeInMainWorld(
  'explorer',
  Object.freeze({
    invoke: (channel: TreeChannels, ...data: unknown[]) => {
      if (!Object.values(TreeChannels).includes(channel)) {
        throw new Error(`[explorer.invoke] Channel "${channel}" is not allowed.`);
      }
      return ipcRenderer.invoke(channel, ...data);
    },
  } as ExplorerAPI)
);
