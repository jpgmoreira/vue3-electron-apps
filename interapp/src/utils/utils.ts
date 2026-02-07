import { toRaw } from 'vue';
import crypto from 'node:crypto';
import slugify from 'slugify';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function toBase62(num: bigint): string {
  if (num === 0n) return ALPHABET[0];
  const base = BigInt(ALPHABET.length);
  let result = '';
  let n = num;
  while (n > 0n) {
    const remainder = n % base;
    result = ALPHABET[Number(remainder)] + result;
    n = n / base;
  }
  return result;
}

/**
 * Shuffle an array in-place.
 */
export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function toLocaleNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function clamp(min: number, max: number, val: number) {
  let res = Math.min(val, max);
  res = Math.max(res, min);
  return res;
}

/**
 * Creates a throttled version of a function that executes at most once every 'wait' milliseconds.
 * Subsequent calls within the wait period are ignored.
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let lastTime = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  } as T;
}

/**
 * Removes an element from an array in-place.
 */
export function arrayRemove<T>(array: T[], element: T) {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

/**
 * Returns a random ID with ~17 characters, containing only alphanumeric characters and underscores.
 */
export function randomId() {
  const timePart = toBase62(BigInt(Date.now()));
  const randomPart = toBase62(BigInt(Math.floor(Math.random() * 1e15)));
  return `${timePart}_${randomPart}`;
}

/**
 * Generates a deterministic hash for a string.
 * The result contains ~43 alphanumeric characters in base 62.
 */
export function genHash(str: string) {
  const hexHash = crypto.createHash('sha256').update(str, 'utf8').digest('hex');
  const hashNumber = BigInt('0x' + hexHash);
  const base62 = toBase62(hashNumber);
  return base62;
}

/**
 * Builds a randomized id based on a name and millisecond-based unix timestamp.
 * The id will contain only lower-case alphanumeric characters and underscores.
 */
export function buildId(name: string, timestamp: number) {
  const slug = slugify(name, {
    strict: true,
    lower: true,
    replacement: '_',
  });
  const code = toBase62(BigInt(timestamp));
  const id = `${slug}_${code}`;
  return id;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.values(obj).forEach((val) => {
    if (val && typeof val === 'object') {
      deepFreeze(val);
    }
  });
  return obj;
}

/**
 * Verifies if a string (query) is a substring of a larger text (text),
 * ignoring leading and trailing whitespaces, and ignoring case.
 */
export function isSubstring(text: string, query: string) {
  return text.trim().toLowerCase().includes(query.trim().toLowerCase());
}

/**
 * Returns true if *every* string in query is contained in base
 * (match ALL).
 */
export function arrayContainsAll(base: string[], query: string[]) {
  return query.every((q) => base.includes(q));
}

/**
 * Returns true if *any* string in query is contained in base
 * (match ANY).
 */
export function arrayContainsAny(base: string[], query: string[]) {
  return query.some((q) => base.includes(q));
}

/**
 * Returns true if both arrays contain exactly the same strings.
 */
export function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const countA: Record<string, number> = {};
  const countB: Record<string, number> = {};
  for (const s of a) countA[s] = (countA[s] ?? 0) + 1;
  for (const s of b) countB[s] = (countB[s] ?? 0) + 1;
  for (const key in countA) {
    if (countA[key] !== countB[key]) return false;
  }
  return true;
}

/**
 * Extracts the file extension name from a mime type:
 */
export function extFromMime(mime: string): string {
  if (!mime) return '';
  const exceptions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'audio/mpeg': '.mp3',
  };
  if (mime in exceptions) return exceptions[mime];
  return `.${mime.split('/')[1]}`;
}

export function toRawDeep<T>(obj: T): T {
  const raw = toRaw(obj);
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(raw)) {
    return raw.map((item) => toRawDeep(item)) as T;
  }
  const result = {} as Partial<T>;
  for (const key in raw) {
    result[key] = toRawDeep(raw[key]);
  }
  return result as T;
}

export function cloneDeep<T>(obj: T): T {
  return structuredClone(toRawDeep(obj));
}
