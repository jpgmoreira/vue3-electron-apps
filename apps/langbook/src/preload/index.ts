// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { type ElectronAPI } from './api';
import { InvokeChannels } from './channels/invoke';
import { OnChannels } from './channels/on';
import '@interapp/components/Explorer/preload';

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
    // This is necessary because in recent versions of Electron, they dropped
    // the "path" property for files in user events in the renderer.
    // [https://github.com/electron/electron/issues/43302#issuecomment-2286132938]
    resolveFilePath(file: File) {
      return webUtils.getPathForFile(file);
    },
  } as ElectronAPI)
);
