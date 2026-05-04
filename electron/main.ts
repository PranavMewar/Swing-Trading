import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'node:path';
import { startServer } from '../server/index';

const isDev = process.env.NODE_ENV === 'development';
const PORT = 43117;

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  await startServer(PORT, app.getPath('userData'));

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0b0e14',
    title: 'Swing Journal',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(null);
}

ipcMain.handle('app:get-api-base', () => `http://127.0.0.1:${PORT}`);

ipcMain.handle('dialog:save-csv', async (_e, defaultName: string) => {
  const res = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export Journal',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  return res.canceled ? null : res.filePath;
});

ipcMain.handle('dialog:open-csv', async () => {
  const res = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Trades',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile'],
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('dialog:open-image', async () => {
  const res = await dialog.showOpenDialog(mainWindow!, {
    title: 'Attach Chart Screenshot',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    properties: ['openFile'],
  });
  return res.canceled ? null : res.filePaths[0];
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
