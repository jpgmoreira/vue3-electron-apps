import { StartupData } from '@common/schemas/startup';
import { defineStore } from 'pinia';

export const useMediaStore = defineStore('media', {
  state: () => ({
    mediaDir: null as string | null,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      if (data.mediaDir) {
        this.mediaDir = data.mediaDir;
      }
    },
    clear() {
      this.mediaDir = null;
    },
    resolveMediaPath(cardId: string, mediaPath: string) {
      // Resolves the path to a media file from the media input.
      if (!this.mediaDir) throw new Error('Media dir not set!');
      const base = this.mediaDir.replace(/\\/g, '/');
      const prefix = base.startsWith('/') ? 'safe-file://' : 'safe-file:///';
      const encodedFile = encodeURIComponent(mediaPath);
      return `${prefix}${base}/${cardId}/${encodedFile}`;
    },
    processRteImages(cardId: string, html: string) {
      // Returns the processed HTML that contains the resolved path
      // for all images from a RTE field.
      if (!html) return html;
      const div = document.createElement('div');
      div.innerHTML = html;
      const imgs = div.querySelectorAll('img');
      imgs.forEach((img) => {
        let src = img.getAttribute('src');
        if (!src) throw new Error('Image does not have a src!');
        const isSafeFile = src.startsWith('safe-file');
        const isBase64 = src.startsWith('data:image');
        const isHash = src.startsWith('hash');
        const isUrl = src.startsWith('http');
        if (isSafeFile || isBase64 || isUrl) return;
        if (isHash) src = src.replace('hash://', '');
        try {
          const resolved = this.resolveMediaPath(cardId, src);
          img.setAttribute('src', resolved);
        } catch (e) {
          throw new Error(`Error processing image src: ${e}`);
        }
      });
      return div.innerHTML;
    },
  },
});
