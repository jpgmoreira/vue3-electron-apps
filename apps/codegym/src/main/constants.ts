import { is } from '@electron-toolkit/utils';
import { app } from 'electron';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@common/constants';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = is.dev
  ? resolve(__dirname, '../..', `${APP_NAME}-data`)
  : resolve(app.getPath('userData'), `${APP_NAME}-data`);
