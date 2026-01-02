import { ensureDirExists } from './fileUtils';
import type { JSONValue, JSONObject } from '@shared/types/json';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { cloneDeep } from './utils';

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
  private debounce = 500;
  private indent = 0;
  private _target: T;
  private _proxy: T;

  constructor(filePath: string, targetObject: T, debounce = 500, indent = 2) {
    this.filePath = filePath;
    this.debounce = debounce;
    this.indent = indent;
    const dir = path.dirname(filePath);
    ensureDirExists(dir);
    if (!fs.existsSync(filePath)) {
      this._target = cloneDeep(targetObject);
      fs.writeFileSync(filePath, JSON.stringify(this._target, null, this.indent));
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
    }, this.debounce);
  }

  private async writeFileAsync() {
    const tmpPath = `${this.filePath}.tmp`;
    const dir = path.dirname(tmpPath);
    ensureDirExists(dir);
    try {
      const data = JSON.stringify(this._target, null, this.indent);
      // 1. Write to temp file:
      await fs.promises.writeFile(tmpPath, data, 'utf-8');
      // 2. Force write to disk (flush):
      const fd = await fs.promises.open(tmpPath, 'r+');
      await fd.sync();
      await fd.close();
      // 3. Atomically replace the old file:
      await fs.promises.rename(tmpPath, this.filePath);
      this.savedCount++;
      console.log(`-- [fileProxy] ${this.filePath} saved! ${this.savedCount}`);
    } catch (err) {
      console.error(`-- [fileProxy] failed to save ${this.filePath}:`, err);
    } finally {
      // Clean up if a temp file was left behind:
      fs.promises.unlink(tmpPath).catch(() => {});
    }
  }
}
