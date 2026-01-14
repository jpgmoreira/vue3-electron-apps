import { BrowserWindow, Menu } from 'electron';
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { is } from '@electron-toolkit/utils';
import { OnChannels } from '@preload/channels/on';
import { loadStartupData } from '@main/startup/startup';
import path from 'path';

export class WindowManager {
  private mainWindow!: BrowserWindow;

  private readonly indexHtmlPath = path.join(__dirname, '../renderer/index.html');
  private readonly iconPath = path.join(__dirname, '../build/icon.png');
  private readonly preloadPath = path.join(__dirname, '../preload/index.js');

  private readonly windowConfig = Object.freeze({
    width: 1200,
    height: 800,
    show: false,
    icon: this.iconPath,
    webPreferences: {
      preload: this.preloadPath,
      spellCheck: false,
    },
  });

  constructor() {
    Menu.setApplicationMenu(null);
    if (is.dev) {
      installExtension(VUEJS_DEVTOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log('An error occurred: ', err));
    }
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
    this.mainWindow = new BrowserWindow(this.windowConfig);
    this.mainWindow.once('ready-to-show', async () => {
      const startupData = await loadStartupData();
      this.mainWindow.webContents.send(OnChannels.loadStartupData, startupData);
      this.mainWindow.show();
    });
    this.initWindow(this.mainWindow);
  }
}
