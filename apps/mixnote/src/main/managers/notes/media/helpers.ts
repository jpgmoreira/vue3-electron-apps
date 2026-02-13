import { ensureDirExists } from '@interapp/utils/fileUtils';
import { genHash } from '@interapp/utils/utils';
import fs from 'fs';
import path from 'path';

export async function saveImage(src: string, fPath: string) {
  if (isSafeFile(src)) {
    throw new Error('Trying to save an already saved image!');
  }
  if (isBase64(src)) {
    saveBase64src(src, fPath);
  } else if (isHttp(src)) {
    await saveHttpSrc(src, fPath);
  }
}

export function extractBaseFromSrc(src: string) {
  if (isSafeFile(src)) {
    return path.basename(src);
  }
  const hash = genHash(src);
  return `${hash}.png`;
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

function saveBase64src(src: string, fPath: string) {
  const base64 = src.slice(src.indexOf(';base64,') + ';base64,'.length);
  const buffer = Buffer.from(base64, 'base64');
  saveBuffer(buffer, fPath);
}

async function saveHttpSrc(src: string, fPath: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to download image: ${src}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  saveBuffer(buffer, fPath);
}

function saveBuffer(buffer: Buffer, fPath: string) {
  ensureDirExists(path.dirname(fPath));
  fs.writeFileSync(fPath, buffer);
}
