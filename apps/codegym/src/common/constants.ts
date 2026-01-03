import packageJson from '../../package.json';
import { is } from '@electron-toolkit/utils';
import { app } from 'electron';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = is.dev
  ? resolve(__dirname, '../..', 'mixnote-data')
  : resolve(app.getPath('userData'), 'mixnote-data');

export const APP_NAME = packageJson.productName;
export const APP_VERSION = packageJson.version;
export const APP_HOMEPAGE = packageJson.homepage;

export const POPULARITY_GROUP_SIZE = 20;
export const HISTORY_PAGE_SIZE = 100;
export const HISTORY_MAX_SIZE_PER_OJ = 2000;
