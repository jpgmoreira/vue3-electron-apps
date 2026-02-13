import { Card } from '@common/schemas/card';
import { DATA_DIR } from '@main/constants';
import { parse } from 'node-html-parser';
import { CARD_RTE_FIELDS } from '@common/schemas/card';
import path from 'path';
import fs from 'fs';
import { ensureDirExists, listFilesInDir } from '@interapp/utils/fileUtils';
import { saveRTEImage } from './helpers';
import { MediaFile } from '@interapp/types/mediaFile';

export class CardsMediaManager {
  // front -> back.
  private saveMedia(media: MediaFile, mediaDir: string) {
    const fPath = path.join(mediaDir, media.name);
    media.base = media.name;
    ensureDirExists(mediaDir);
    fs.copyFileSync(media.path, fPath);
  }

  // front -> back.
  private async saveRTEImage(img: HTMLElement, mediaDir: string) {
    const src = img.getAttribute('src');
    if (!src) throw new Error('Img without src!');
    const base = await saveRTEImage(src, mediaDir);
    img.setAttribute('data-base', base);
  }

  // front -> back.
  public async cardWasCreated(card: Card, profileId: string) {
    const mediaDir = this.buildMediaDir(card.id, profileId);
    for (const media of card.media) {
      this.saveMedia(media, mediaDir);
    }
    for (const field of CARD_RTE_FIELDS) {
      const html = parse(card[field]);
      const imgs = html.querySelectorAll('img');
      if (!imgs.length) continue;
      for (const img of imgs) {
        const el = img as unknown as HTMLElement;
        await this.saveRTEImage(el, mediaDir);
        img.removeAttribute('src');
      }
      card[field] = html.toString();
    }
  }

  // front -> back.
  public async cardWasUpdated(card: Card, profileId: string) {
    const allBases: string[] = [];
    const mediaDir = this.buildMediaDir(card.id, profileId);
    for (const media of card.media) {
      if (!media.base) this.saveMedia(media, mediaDir);
      allBases.push(media.base!);
    }
    for (const field of CARD_RTE_FIELDS) {
      const html = parse(card[field]);
      const imgs = html.querySelectorAll('img');
      if (!imgs.length) continue;
      for (const img of imgs) {
        // Here I use the data-base attribute to
        // determine if the image was already saved.
        if (!img.hasAttribute('data-base')) {
          const el = img as unknown as HTMLElement;
          await this.saveRTEImage(el, mediaDir);
        }
        img.removeAttribute('src');
        const base = img.getAttribute('data-base')!;
        allBases.push(base);
      }
      card[field] = html.toString();
    }
    if (!fs.existsSync(mediaDir)) return;
    if (allBases.length === 0) {
      fs.rmSync(mediaDir, { recursive: true, force: true });
      return;
    }
    // Delete old removed media from the disk:
    const allOldCardFiles = listFilesInDir(mediaDir);
    const allNewCardFiles = allBases.map((b) => path.resolve(mediaDir, b));
    for (const file of allOldCardFiles) {
      if (!allNewCardFiles.includes(file)) {
        fs.unlinkSync(file);
      }
    }
  }

  // front -> back.
  public deleteMediaFolder(cardId: string, profileId: string) {
    const mediaDir = this.buildMediaDir(cardId, profileId);
    fs.rmSync(mediaDir, { force: true, recursive: true });
  }

  // back -> front.
  /**
   * - Prepares all paths, from media input and RTE, so that the front can use them.
   * - All media files and RTE images here were already saved in the past, so here they
   *   are guaranteed to have the base property.
   * - Remember that the base property will contain only the file name with extension,
   *   as saved inside of the media folder.
   * - When sending images to the front, I cannot remove the "data-base" attribute of
   *   the images, because I will use it in the back again to determine if the image
   *   was already saved or not.
   */
  public preparePaths(card: Card, profileId: string) {
    const mediaDir = this.buildMediaDir(card.id, profileId);
    for (const media of card.media) {
      if (!media.base) throw new Error('Media without base!');
      const fName = path.join(mediaDir, media.base);
      media.path = `safe-file://${fName}`;
    }
    for (const field of CARD_RTE_FIELDS) {
      const html = parse(card[field]);
      const imgs = html.querySelectorAll('img');
      if (!imgs.length) continue;
      for (const img of imgs) {
        const base = img.getAttribute('data-base');
        if (!base) throw new Error('Image without data-base attribute!');
        const fName = path.join(mediaDir, base);
        img.setAttribute('src', `safe-file://${fName}`);
      }
      card[field] = html.toString();
    }
  }

  private buildMediaDir(cardId: string, profileId: string) {
    return path.join(DATA_DIR, 'profileData', profileId, 'media', cardId);
  }
}
