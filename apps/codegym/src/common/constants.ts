import packageJson from '../../package.json';
import { is } from '@electron-toolkit/utils';
import { app } from 'electron';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_NAME = packageJson.name;
export const APP_PRODUCT_NAME = packageJson.productName;
export const APP_VERSION = packageJson.version;
export const APP_HOMEPAGE = packageJson.homepage;

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = is.dev
  ? resolve(__dirname, '../..', `${APP_NAME}-data`)
  : resolve(app.getPath('userData'), `${APP_NAME}-data`);

export const POPULARITY_GROUP_SIZE = 20;
export const HISTORY_PAGE_SIZE = 100;
export const HISTORY_MAX_SIZE_PER_OJ = 2000;
