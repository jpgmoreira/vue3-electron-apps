import { DATA_DIR } from '@main/constants';
import path from 'path';
import fs from 'fs';
import { saveImage, extractBaseFromSrc } from './helpers';
import { Note } from '@common/schemas/notes';
import { ensureDirExists, listFilesInDir } from '@interapp/utils/fileUtils';

export class NotesMediaManager {
  // Necessary to recreate the regexes because they save state.
  private getRegexes() {
    return {
      htmlImgRegex: /<img\b([^>]*?)\/?>/gi,
      htmlAttrRegex: /([^\s=]+)=["']([^"']*)["']/g,
      mdImgRegex: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    };
  }

  // back -> front.
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

  // front -> back.
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
      // Remove the "src" because it can be
      // a very large base64 code.
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

  // front -> back.
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
        // Do not include the "src" because it can be
        // a very large base64 code.
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

  // front -> back.
  public async noteWasUpdated(note: Note, profileId: string) {
    const htmlResult = this.processHtmlImages(note.body);
    const markdownResult = this.processMarkdownImages(htmlResult.result);
    const allBases = [...htmlResult.bases, ...markdownResult.bases];
    const allSources = [...htmlResult.sources, ...markdownResult.sources];
    const noteDir = this.buildNoteDir(note.id, profileId);
    const trashDir = this.buildTrashDir(note.id, profileId);
    const allNewFiles = allBases.map((b) => path.resolve(noteDir, b));
    const allOldFiles = listFilesInDir(noteDir);

    // Send removed files to the trash:
    for (const file of allOldFiles) {
      if (file.endsWith('.json')) continue;
      if (!allNewFiles.includes(file)) {
        const basename = path.basename(file);
        const pathInTrash = path.join(trashDir, basename);
        if (fs.existsSync(pathInTrash)) {
          fs.rmSync(file);
        } else {
          ensureDirExists(trashDir);
          fs.renameSync(file, pathInTrash);
        }
      }
    }

    // Save new files:
    for (let i = 0; i < allBases.length; i++) {
      const fPath = allNewFiles[i];
      const source = allSources[i];
      if (fs.existsSync(fPath)) continue;
      // Recover undo removal:
      const basename = path.basename(fPath);
      const pathInTrash = path.join(trashDir, basename);
      if (fs.existsSync(pathInTrash)) {
        fs.renameSync(pathInTrash, fPath);
        continue;
      }
      // Save:
      await saveImage(source, fPath);
    }

    note.body = markdownResult.result;
  }

  private buildNoteDir(noteId: string, profileId: string) {
    return path.join(DATA_DIR, 'profileData', profileId, 'notes', noteId);
  }
  private buildTrashDir(noteId: string, profileId: string) {
    return path.join(DATA_DIR, 'profileData', profileId, 'trash', noteId);
  }
}
