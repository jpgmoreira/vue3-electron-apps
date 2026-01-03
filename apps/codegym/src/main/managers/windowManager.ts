import { join } from 'path';
import { BrowserWindow, Menu } from 'electron';
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { is } from '@electron-toolkit/utils';
import { loadStartupData } from '../data/startup';
import { OnChannels } from '@preload/channels/on';

export class WindowManager {
  static #instance: WindowManager;

  private mainWindow!: BrowserWindow;

  private readonly indexHtmlPath = join(__dirname, '../../renderer/index.html');
  private readonly iconPath = join(__dirname, '../../../build/icon.png');
  private readonly preloadPath = join(__dirname, '../../preload/index.js');

  private readonly commonWindowConfig = Object.freeze({
    show: false,
    icon: this.iconPath,
    webPreferences: {
      preload: this.preloadPath,
      spellCheck: false,
    },
  });

  private constructor() {
    Menu.setApplicationMenu(null);
    if (is.dev) {
      installExtension(VUEJS_DEVTOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log('An error occurred: ', err));
    }
  }

  public static get instance(): WindowManager {
    if (!this.#instance) {
      this.#instance = new WindowManager();
    }
    return this.#instance;
  }

  private initWindow(window: BrowserWindow) {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
      window.loadFile(this.indexHtmlPath);
    }
    if (is.dev) {
      window.webContents.openDevTools({ mode: 'right' });
    }
  }

  public createMainWindow(): void {
    if (BrowserWindow.getAllWindows().length !== 0) return;
    this.mainWindow = new BrowserWindow({
      ...this.commonWindowConfig,
      width: 1200,
      height: 800,
    });
    this.mainWindow.once('ready-to-show', async () => {
      const startupData = await loadStartupData();
      this.mainWindow.webContents.send(OnChannels.loadStartupData, startupData);
      this.mainWindow.show();
    });
    this.initWindow(this.mainWindow);
  }
}
