import { MediaInputAPI } from '../preload/api';

declare global {
  interface Window {
    media: MediaInputAPI;
  }
}
