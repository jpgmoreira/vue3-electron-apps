import { getEmptyOjMeta, OjMeta } from '@common/schemas/ojMeta';
import { FileProxy } from '@interapp/utils/fileProxy';
import { DATA_DIR } from '@main/constants';
import { Oj } from '@common/schemas/oj';
import path from 'path';

export class OjMetaManager {
  private proxy: FileProxy<OjMeta>;

  constructor() {
    this.proxy = new FileProxy(path.join(DATA_DIR, 'ojMeta.json'), getEmptyOjMeta());
  }

  public getOjMeta(): OjMeta {
    return this.proxy.target;
  }

  public updateOjMeta<T extends Oj>(oj: T, meta: OjMeta[T]) {
    this.proxy.proxy[oj] = meta;
  }
}
