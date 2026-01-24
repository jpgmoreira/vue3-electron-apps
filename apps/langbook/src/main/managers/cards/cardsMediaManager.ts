import { Card } from '@common/schemas/card';
import { DATA_DIR } from '@main/constants';
import path from 'path';
import fs from 'fs';
import { ensureDirExists, isFileInsideDirectory } from '@interapp/utils/fileUtils';
import { extFromMime, genHash } from '@interapp/utils/utils';

export class CardsMediaManager {
  /**
   * Media files that come from the media input:
   *  - They can come with:
   *      1. The full absolute path on the machine (new files);
   *      2. Just the filename in the media folder (existing files).
   *
   *  - The path of the media files will not come with the safe-file:// protocol.
   *  - All files in the cards media will have their "path" set as the file basename in the media folder.
   */

  private processMediaInput(card: Card, mediaDir: string) {
    const mediaDelete: string[] = [];
    for (let i = 0; i < card.media.length; i++) {
      const media = card.media[i];
      // file already contained in the media folder: skip.
      if (this.mediaAlreadySaved(mediaDir, media.path)) {
        continue;
      }
      // tried to deliberately copy a file from inside the media folder:
      if (isFileInsideDirectory(mediaDir, media.path)) {
        mediaDelete.push(media.name);
        continue;
      }
      // if the file does not exist in the user's computer: remove.
      if (!fs.existsSync(media.path)) {
        mediaDelete.push(media.name);
        continue;
      }
      const ext = path.extname(media.name) ? '' : extFromMime(media.type);
      const mediaFile = `${media.name}${ext}`;
      const newPath = path.join(mediaDir, mediaFile);
      fs.copyFileSync(media.path, newPath);
      media.path = mediaFile; // Store only file name in media folder.
    }
    card.media = card.media.filter((m) => !mediaDelete.includes(m.name));
  }

  /**
   * Image files that come from the RTE fields:
   *  - They can come as:
   *      1. base64 images;
   *      2. Urls;
   *      3. safe-file://<full_path> images (existing images).
   *
   *  - For every file a deterministic hash will be calculated.
   *  - This hash will be the name of the image in the media folder.
   *  - The "src" attribute of the image will be set as "hash://<image_hash>.png".
   *  - The calculation of a hash helps to avoid saving duplicated images.
   */
  private processRteField(content: string, mediaDir: string): string {
    // <img src="..."> or <img src='...'>
    content = content.replace(
      /<img\b[^>]*?\bsrc\s*=\s*(['"])(.*?)\1[^>]*?>/gi,
      (fullMatch, _, src) => {
        let hash = '';
        if (this.isSafeFile(src)) {
          hash = this.extractHashFromSafeFile(src);
        } else if (this.isBase64(src)) {
          const normalized = this.normalizeBase64src(src);
          hash = genHash(normalized);
        } else {
          hash = genHash(src);
        }
        const name = `${hash}.png`;
        if (!this.mediaAlreadySaved(mediaDir, name)) {
          this.saveImage(mediaDir, src, name);
        }
        return fullMatch.replace(src, `hash://${name}`);
      }
    );
    return content;
  }

  private saveImage(mediaDir: string, src: string, name: string) {
    if (this.isSafeFile(src)) {
      // Do nothing, image already saved.
    } else if (this.isBase64(src)) {
      this.saveBase64src(mediaDir, src, name);
    } else if (this.isHttp(src)) {
      this.saveHttpSrc(mediaDir, src, name);
    }
  }

  private saveBuffer(mediaDir: string, buffer: Buffer, name: string) {
    const fPath = path.join(mediaDir, name);
    fs.writeFileSync(fPath, buffer);
  }

  private saveBase64src(mediaDir: string, src: string, name: string) {
    const base64 = src.slice(src.indexOf(';base64,') + ';base64,'.length);
    const buffer = Buffer.from(base64, 'base64');
    this.saveBuffer(mediaDir, buffer, name);
  }

  private async saveHttpSrc(mediaDir: string, src: string, name: string) {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    this.saveBuffer(mediaDir, buffer, name);
  }

  private mediaAlreadySaved(mediaDir: string, fName: string) {
    return fs.existsSync(path.join(mediaDir, fName));
  }

  private processRteImages(card: Card, mediaDir: string) {
    card.front = this.processRteField(card.front, mediaDir);
    card.back = this.processRteField(card.back, mediaDir);
    card.extra = this.processRteField(card.extra, mediaDir);
  }

  private isSafeFile(src: string) {
    return src.startsWith('safe-file');
  }
  private isBase64(src: string) {
    return src.startsWith('data:image');
  }
  private isHttp(src: string) {
    return src.startsWith('http');
  }

  private normalizeBase64src(src: string) {
    return src.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  }

  private extractHashFromSafeFile(src: string): string {
    const name = path.parse(src).name;
    const hash = name.split('_').at(-1)!;
    return hash;
  }

  public async processCardMedia(card: Card, profileId: string) {
    const mediaDir = path.join(DATA_DIR, 'profileData', profileId, 'media', card.id);
    ensureDirExists(mediaDir);
    this.processMediaInput(card, mediaDir);
    this.processRteImages(card, mediaDir);
  }
}
