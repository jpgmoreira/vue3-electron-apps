// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, webUtils } from 'electron';
import { type MediaInputAPI } from './api';

// https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
contextBridge.exposeInMainWorld(
  'media',
  Object.freeze({
    // This is necessary because in recent versions of Electron, they dropped
    // the "path" property for files in user events in the renderer.
    // [https://github.com/electron/electron/issues/43302#issuecomment-2286132938]
    resolveFilePath(file: File) {
      return webUtils.getPathForFile(file);
    },
  } as MediaInputAPI)
);
