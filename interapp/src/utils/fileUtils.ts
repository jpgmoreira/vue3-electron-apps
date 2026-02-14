import fs from 'fs';
import path from 'path';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Returns a list containing the absolute path ao all files in the subtree.
 */
export function listFilesInDir(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesInDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}
