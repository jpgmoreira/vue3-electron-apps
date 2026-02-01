import { ensureDirExists } from '@interapp/utils/fileUtils';
import { genHash } from '@interapp/utils/utils';
import fs from 'fs';
import path from 'path';

export async function saveRTEImage(src: string, mediaDir: string): Promise<string> {
  if (isSafeFile(src)) {
    throw new Error('Trying to save an already saved image!');
  }
  const hash = genHash(src);
  const fName = `${hash}.png`;
  if (fs.existsSync(path.join(mediaDir, fName))) {
    return fName;
  }
  if (isBase64(src)) {
    saveBase64src(src, mediaDir, fName);
  } else if (isHttp(src)) {
    await saveHttpSrc(src, mediaDir, fName);
  }
  return fName;
}

function isSafeFile(src: string) {
  return src.startsWith('safe-file');
}
function isBase64(src: string) {
  return src.startsWith('data:image');
}
function isHttp(src: string) {
  return src.startsWith('http');
}

function saveBase64src(src: string, mediaDir: string, fName: string) {
  const base64 = src.slice(src.indexOf(';base64,') + ';base64,'.length);
  const buffer = Buffer.from(base64, 'base64');
  saveBuffer(mediaDir, buffer, fName);
}

async function saveHttpSrc(src: string, mediaDir: string, fName: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to download image: ${src}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  saveBuffer(mediaDir, buffer, fName);
}

function saveBuffer(mediaDir: string, buffer: Buffer, fName: string) {
  const fPath = path.join(mediaDir, fName);
  ensureDirExists(mediaDir);
  fs.writeFileSync(fPath, buffer);
}
