import { ElectronAPI } from '@preload/api';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
