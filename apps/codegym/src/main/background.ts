import { app, BrowserWindow, Menu, globalShortcut } from 'electron';
import type { Event, WebContents, WebPreferences } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { loadStartupData } from './data/startup';
import { Channels } from '@common/types/channels';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      spellcheck: false,
    },
  });
  Menu.setApplicationMenu(null);

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', async () => {
    const startupData = await loadStartupData();
    mainWindow.webContents.send(Channels.loadStartupData, startupData);
    mainWindow.show();
  });

  if (is.dev) {
    installExtension(VUEJS_DEVTOOLS)
      .then((ext) => console.log(`Added Extension:  ${ext.name}`))
      .catch((err) => console.log('An error occurred: ', err));
    mainWindow.webContents.openDevTools({ mode: 'right' });
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
    globalShortcut.register('F12', () => {
      const win = BrowserWindow.getFocusedWindow();
      if (win) {
        win.webContents.openDevTools({ mode: 'right' });
      }
    });
  });
  createWindow();
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Additional security config.
app.on('web-contents-created', (_event: Event, contents: WebContents) => {
  contents.on(
    'will-attach-webview',
    (event: Event, _webPreferences: WebPreferences, _params: Record<string, string>) => {
      event.preventDefault();
    }
  );
  contents.on('will-navigate', (event: Event, _navigationUrl: string) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
