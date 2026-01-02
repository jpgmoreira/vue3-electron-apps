import fs from 'fs';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}
