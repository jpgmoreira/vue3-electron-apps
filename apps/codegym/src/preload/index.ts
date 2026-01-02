// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import {
  allowedInvokeChannels,
  allowedOnChannels,
  allowedSendChannels,
  type ElectronAPI,
} from './api';

type SendChannel = (typeof allowedSendChannels)[number];
type InvokeChannel = (typeof allowedInvokeChannels)[number];
type OnChannel = (typeof allowedOnChannels)[number];

// https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
contextBridge.exposeInMainWorld(
  'api',
  Object.freeze({
    send: (channel: SendChannel, ...data: unknown[]) => {
      if (!allowedSendChannels.includes(channel)) {
        console.warn(`[api.send] Channel "${channel}" is not allowed.`);
        return;
      }
      ipcRenderer.send(channel, ...data);
    },
    invoke: (channel: InvokeChannel, ...data: unknown[]) => {
      if (!allowedInvokeChannels.includes(channel)) {
        return Promise.reject(new Error(`[api.invoke] Channel "${channel}" is not allowed.`));
      }
      return ipcRenderer.invoke(channel, ...data);
    },
    on: (channel: OnChannel, func: (...data: unknown[]) => void) => {
      if (!allowedOnChannels.includes(channel)) {
        console.warn(`[api.on] Channel "${channel}" is not allowed.`);
        return;
      }
      ipcRenderer.on(channel, (_, ...args) => func(...args));
    },
  } as ElectronAPI)
);
