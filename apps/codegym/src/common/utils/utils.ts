import { type AuthPage, authPageList } from '@common/types/authPage';
import slugify from 'slugify';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function toBase62(num: number): string {
  if (num === 0) return ALPHABET[0];
  const base = ALPHABET.length;
  let result = '',
    n = num;
  while (n > 0) {
    const remainder = n % base;
    result = ALPHABET[remainder] + result;
    n = Math.floor(n / base);
  }
  return result;
}

export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function toLocaleNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

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
 * Returns a random alphanumeric ID with ~20 characters.
 */
export function randomId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(1);
}

/**
 * Builds a randomized id based on a name and millisecond-based unix timestmap.
 */
export function buildId(name: string, timestamp: number) {
  const slug = slugify(name, {
    strict: true,
    lower: true,
  });
  const code = toBase62(timestamp);
  const id = `${slug}-${code}`;
  return id;
}

export function isAuthPage(page: string): page is AuthPage {
  return (authPageList as readonly string[]).includes(page);
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
