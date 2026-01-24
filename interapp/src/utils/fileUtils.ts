import fs from 'fs';
import path from 'path';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function isFileInsideDirectory(directoryPath: string, filePath: string): boolean {
  const dir = path.resolve(directoryPath);
  const file = path.resolve(filePath);
  const relative = path.relative(dir, file);
  return Boolean(relative && !relative.startsWith('..'));
}
