// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { type ElectronAPI } from './api';
import { InvokeChannels } from './channels/invoke';
import { OnChannels } from './channels/on';

// https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
contextBridge.exposeInMainWorld(
  'api',
  Object.freeze({
    invoke: (channel: InvokeChannels, ...data: unknown[]) => {
      if (!Object.values(InvokeChannels).includes(channel)) {
        throw new Error(`[api.invoke] Channel "${channel}" is not allowed.`);
      }
      return ipcRenderer.invoke(channel, ...data);
    },
    on: (channel: OnChannels, func: (...data: unknown[]) => void) => {
      if (!Object.values(OnChannels).includes(channel)) {
        throw new Error(`[api.on] Channel "${channel}" is not allowed.`);
      }
      ipcRenderer.on(channel, (_, ...args) => func(...args));
    },
  } as ElectronAPI)
);
