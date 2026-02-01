import { Card } from '@common/schemas/card';
import { DATA_DIR } from '@main/constants';
import { parse } from 'node-html-parser';
import { CARD_RTE_FIELDS } from '@common/schemas/card';
import path from 'path';

export class CardsMediaManager {
  public cardWasCreated(card: Card, profileId: string) {}

  public deleteMediaFolder(cardId: string, profileId: string) {}

  public cardWasUpdated(oldCard: Card, newCard: Card, profileId: string) {}

  /**
   * - Prepares all paths, from media input and RTE, so that the front can use them.
   * - All media files and RTE images here were already saved in the past, so here they
   *   are guaranteed to have the base property.
   * - Remember that the base property will contain only the file name with extension,
   *   as saved inside of the media folder.
   */
  public preparePaths(card: Card, profileId: string) {
    const mediaDir = this.buildMediaDir(card.id, profileId);
    for (const media of card.media) {
      const fName = path.join(mediaDir, media.base);
      media.path = `safe-file://${fName}`;
    }
    for (const field of CARD_RTE_FIELDS) {
      const html = parse(card[field]);
      const imgs = html.querySelectorAll('img');
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
