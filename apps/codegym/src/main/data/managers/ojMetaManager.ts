import { getEmptyOjMeta, OjMeta } from '@common/schemas/ojMeta';
import { FileProxy } from '../fileProxy';
import { DATA_DIR } from '../constants';
import path from 'path';
import { Oj } from '@common/types/oj';

/**
 * Singleton for managing oj metadata.
 * Access via OjMetaManager.instance
 */
export class OjMetaManager {
  static #instance: OjMetaManager;
  private proxy: FileProxy<OjMeta>;

  private constructor() {
    this.proxy = new FileProxy(path.join(DATA_DIR, 'ojMeta.json'), getEmptyOjMeta());
  }

  public static get instance(): OjMetaManager {
    if (!this.#instance) {
      this.#instance = new OjMetaManager();
    }
    return this.#instance;
  }

  public getAllMeta(): OjMeta {
    return this.proxy.target;
  }

  public updateOjMeta<T extends Oj>(oj: T, meta: OjMeta[T]) {
    this.proxy.proxy[oj] = meta;
  }
}
