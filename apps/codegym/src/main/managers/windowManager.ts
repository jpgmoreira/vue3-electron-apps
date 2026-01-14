import { app, BrowserWindow, Menu } from 'electron';
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
  }

  private async installDevTools() {
    if (is.dev) {
      try {
        const ext = await installExtension(VUEJS_DEVTOOLS);
        console.log(`Added Extension: ${ext.name}`);
      } catch (err) {
        console.log('An error occurred: ', err);
      }
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

  public async createMainWindow(): Promise<void> {
    if (BrowserWindow.getAllWindows().length !== 0) return;
    await app.whenReady();
    await this.installDevTools();
    this.mainWindow = new BrowserWindow(this.windowConfig);
    this.mainWindow.once('ready-to-show', async () => {
      const startupData = await loadStartupData();
      this.mainWindow.webContents.send(OnChannels.loadStartupData, startupData);
      this.mainWindow.show();
    });
    this.initWindow(this.mainWindow);
  }
}
