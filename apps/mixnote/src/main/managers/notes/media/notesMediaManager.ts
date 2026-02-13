import { DATA_DIR } from '@main/constants';
import path from 'path';
import fs from 'fs';
import { listFilesInDir } from '@interapp/utils/fileUtils';
import { saveImage, extractBaseFromSrc } from './helpers';
import { Note } from '@common/schemas/notes';

export class NotesMediaManager {
  /**
   * - Prepares all paths so that the front can use them.
   * - All image files here were already saved in the past, so here they
   *   are guaranteed to have the base property.
   * - Remember that the base property will contain only the file name with extension,
   *   as saved inside of the note folder.
   */
  // public preparePaths(card: Card, profileId: string) {
  //   const mediaDir = this.buildMediaDir(card.id, profileId);
  //   for (const media of card.media) {
  //     if (!media.base) throw new Error('Media without base!');
  //     const fName = path.join(mediaDir, media.base);
  //     media.path = `safe-file://${fName}`;
  //   }
  //   for (const field of CARD_RTE_FIELDS) {
  //     const html = parse(card[field]);
  //     const imgs = html.querySelectorAll('img');
  //     if (!imgs.length) continue;
  //     for (const img of imgs) {
  //       const base = img.getAttribute('data-base');
  //       if (!base) throw new Error('Image without data-base attribute!');
  //       const fName = path.join(mediaDir, base);
  //       img.setAttribute('src', `safe-file://${fName}`);
  //     }
  //     card[field] = html.toString();
  //   }
  // }

  private processHtmlImages(content: string) {
    const htmlImgRegex = /<img\b([^>]*?)\/?>/gi;
    const htmlAttrRegex = /([^\s=]+)=["']([^"']*)["']/g;
    const bases: string[] = [];
    const sources: string[] = [];
    const result = content.replace(htmlImgRegex, (_: string, attrs: string): string => {
      const parsed: Record<string, string> = {};
      let match: RegExpExecArray | null;
      while ((match = htmlAttrRegex.exec(attrs)) !== null) {
        const [, key, value] = match;
        parsed[key] = value;
      }
      const src = parsed.src;
      if (!src) throw new Error('<img> without src!');
      const base = extractBaseFromSrc(src);
      bases.push(base);
      sources.push(src);
      parsed['data-base'] = base;
      const newTag: string =
        '<img ' +
        Object.entries(parsed)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ') +
        ' />';
      return newTag;
    });
    return { bases, sources, result };
  }

  private processMarkdownImages(content: string) {
    // ![alt](src "title")
    const mdImgRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
    const bases: string[] = [];
    const sources: string[] = [];
    const result = content.replace(
      mdImgRegex,
      (_: string, alt: string, src: string, title?: string): string => {
        if (!src) throw new Error('Markdown image without src!');
        const base = extractBaseFromSrc(src);
        bases.push(base);
        sources.push(src);
        const parsed: Record<string, string> = {
          src,
          alt,
          'data-base': base,
        };
        if (title) {
          parsed.title = title;
        }
        const newTag: string =
          '<img ' +
          Object.entries(parsed)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ') +
          ' />';
        return newTag;
      }
    );
    return { bases, sources, result };
  }

  public async noteWasUpdated(note: Note, profileId: string) {
    const htmlResult = this.processHtmlImages(note.body);
    const markdownResult = this.processMarkdownImages(htmlResult.result);
    const allBases = [...htmlResult.bases, ...markdownResult.bases];
    const allSources = [...htmlResult.sources, ...markdownResult.sources];
    const noteDir = this.buildNoteDir(note.id, profileId);
    const allOldFiles = listFilesInDir(noteDir);
    const allNewFiles = allBases.map((b) => path.resolve(noteDir, b));
    // Delete old files that were removed from the note:
    for (const file of allOldFiles) {
      if (file.endsWith('.json')) continue;
      if (!allNewFiles.includes(file)) {
        fs.unlinkSync(file);
      }
    }
    // Save new files:
    for (let i = 0; i < allBases.length; i++) {
      const fPath = allNewFiles[i];
      const source = allSources[i];
      if (fs.existsSync(fPath)) continue;
      await saveImage(source, fPath);
    }
    note.body = markdownResult.result;
  }

  private buildNoteDir(noteId: string, profileId: string) {
    return path.join(DATA_DIR, 'profileData', profileId, 'notes', noteId);
  }
}
