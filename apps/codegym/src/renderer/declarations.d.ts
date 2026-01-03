import { ElectronAPI } from '@preload/api';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}
