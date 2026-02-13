import { DATA_DIR } from '@main/constants';
import path from 'path';
import fs from 'fs';
import { saveImage, extractBaseFromSrc } from './helpers';
import { Note } from '@common/schemas/notes';

export class NotesMediaManager {
  // Necessary to recreate the regexes because they save state.
  private getRegexes() {
    return {
      htmlImgRegex: /<img\b([^>]*?)\/?>/gi,
      htmlAttrRegex: /([^\s=]+)=["']([^"']*)["']/g,
      mdImgRegex: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    };
  }

  /**
   * - Prepares all paths so that the front can use them.
   * - All image files here were already saved in the past, so here they
   *   are guaranteed to have the base property.
   * - Remember that the base property will contain only the file name with extension,
   *   as saved inside of the note folder.
   */
  public preparePaths(note: Note, dirPath: string) {
    const { htmlImgRegex, htmlAttrRegex } = this.getRegexes();
    const result = note.body.replace(htmlImgRegex, (_: string, attrs: string): string => {
      const parsed: Record<string, string> = {};
      let match: RegExpExecArray | null;
      while ((match = htmlAttrRegex.exec(attrs)) !== null) {
        const [, key, value] = match;
        parsed[key] = value;
      }
      const base = parsed['data-base'];
      if (!base) {
        throw new Error('<img> is missing data-base attribute in preparePaths()');
      }
      parsed.src = `safe-file://${dirPath}/${base}`;
      delete parsed['data-base'];
      const newTag =
        '<img ' +
        Object.entries(parsed)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ') +
        ' />';
      return newTag;
    });
    note.body = result;
  }

  private processHtmlImages(content: string) {
    const bases: string[] = [];
    const sources: string[] = [];
    const { htmlImgRegex, htmlAttrRegex } = this.getRegexes();
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
      delete parsed.src;
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
    const bases: string[] = [];
    const sources: string[] = [];
    const { mdImgRegex } = this.getRegexes();
    const result = content.replace(
      mdImgRegex,
      (_: string, alt: string, src: string, title?: string): string => {
        if (!src) throw new Error('Markdown image without src!');
        const base = extractBaseFromSrc(src);
        bases.push(base);
        sources.push(src);
        const parsed: Record<string, string> = {
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
    const allNewFiles = allBases.map((b) => path.resolve(noteDir, b));

    // -- I have decided to keep old removed files from the notes,
    //      because if I immediately removed them, it would break
    //      the "undo" functionality in the notes, in the case where
    //      the user removed a safe-file image, then did undo
    //      (the image would have gone and the path would not exist anymore).
    //    Thus, I decided to never delete removed images.
    // const allOldFiles = listFilesInDir(noteDir);
    // for (const file of allOldFiles) {
    //   if (file.endsWith('.json')) continue;
    //   if (!allNewFiles.includes(file)) {
    //     fs.unlinkSync(file);
    //   }
    // }

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
