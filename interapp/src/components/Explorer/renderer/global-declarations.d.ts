import { ExplorerApi } from '../preload/api';

declare global {
  interface Window {
    explorer: ExplorerApi;
  }
}
