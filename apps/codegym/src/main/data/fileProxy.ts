import { ensureDirExists } from './utils';
import type { JSONValue, JSONObject } from '@common/types/json';
import fs from 'fs';
import util from 'util';
import path from 'path';

export const INDENT = 0;
export const DISK_FLUSH_DEBOUNCE = 500; // Debounce in milliseconds to write file to disk.

/**
 * Creates a proxy around a JSON-serializable object that automatically persists changes to disk.
 *
 * Every modification to the proxy — including changes to nested objects — is synchronized
 * to the specified file, with a debounce to prevent excessive disk writes (default 500ms).
 *
 * Access the live proxy via the `proxy` property, and the underlying target object
 * via the `target` property.
 *
 * Example usage:
 *
 * const myProxy = new FileProxy(filePath, initialObject);
 * myProxy.proxy.someField = 123; // automatically writes to file after debounce
 */
export class FileProxy<T extends JSONObject> {
  private savedCount = 0;
  private filePath: string;
  private timer?: ReturnType<typeof setTimeout>;
  private writingPromise: Promise<void> | null = null;
  private _target: T;
  private _proxy: T;

  constructor(filePath: string, targetObject: T) {
    this.filePath = filePath;
    const dir = path.dirname(filePath);
    ensureDirExists(dir);
    if (!fs.existsSync(filePath)) {
      this._target = structuredClone(targetObject);
      fs.writeFileSync(filePath, JSON.stringify(this._target, null, INDENT));
    } else {
      this._target = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    this._proxy = new Proxy(this._target, this.handler) as T;
  }

  public get proxy() {
    return this._proxy;
  }

  public get target() {
    return this._target;
  }

  private handler = {
    get: this.proxyGetHandler.bind(this),
    set: this.proxySetHandler.bind(this),
    deleteProperty: this.proxyDeleteHandler.bind(this),
  };

  private proxyDeleteHandler(obj: JSONObject, prop: string) {
    if (!(prop in obj)) return true;
    delete obj[prop];
    this.queueWrite();
    return true;
  }

  private proxyGetHandler(obj: JSONObject, prop: string) {
    if (!util.types.isProxy(obj[prop]) && typeof obj[prop] === 'object' && obj[prop] !== null) {
      return new Proxy(obj[prop], this.handler);
    }
    return obj[prop];
  }

  private proxySetHandler(obj: JSONObject, prop: string, value: JSONValue) {
    if (obj[prop] === value) return true;
    obj[prop] = value;
    this.queueWrite();
    return true;
  }

  /**
   * Queues a write operation with debounce and serialization.
   * - Debounce prevents too many writes in quick succession.
   * - Promise chaining ensures writes never overlap (each waits for the previous to finish).
   */
  public queueWrite() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.writingPromise) {
        // Use an arrow function to preserve the class context (`this`).
        // Passing `this.writeFileAsync` directly would lose its binding when called by `finally`.
        this.writingPromise = this.writingPromise.finally(() => this.writeFileAsync());
      } else {
        this.writingPromise = this.writeFileAsync();
      }
    }, DISK_FLUSH_DEBOUNCE);
  }

  private async writeFileAsync() {
    const tmpPath = `${this.filePath}.tmp`;
    const dir = path.dirname(tmpPath);
    ensureDirExists(dir);
    try {
      const data = JSON.stringify(this._target, null, INDENT);
      // 1. Write to temp file:
      await fs.promises.writeFile(tmpPath, data, 'utf-8');
      // 2. Force write to disk (flush):
      const fd = await fs.promises.open(tmpPath, 'r+');
      await fd.sync();
      await fd.close();
      // 3. Atomically replace the old file:
      await fs.promises.rename(tmpPath, this.filePath);
      this.savedCount++;
      console.log(`-- ${this.filePath} saved! ${this.savedCount}`);
    } catch (err) {
      console.error(`-- failed to save ${this.filePath}:`, err);
    } finally {
      // Clean up if a temp file was left behind:
      fs.promises.unlink(tmpPath).catch(() => {});
    }
  }
}
