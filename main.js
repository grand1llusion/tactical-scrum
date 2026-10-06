'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE = () => path.join(app.getPath('userData'), 'tactical-scrum.json');
const MAX = 5 * 1024 * 1024;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    backgroundColor: '#d8cba8', title: 'Tactical Scrum',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Never navigate away or open new windows from the page.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

ipcMain.handle('ts:load', async () => {
  try { return await fs.promises.readFile(FILE(), 'utf8'); } catch (e) { return null; }
});
ipcMain.handle('ts:save', async (_e, text) => {
  if (typeof text !== 'string' || text.length > MAX) { throw new Error('bad data'); }
  const tmp = FILE() + '.tmp';
  await fs.promises.mkdir(path.dirname(FILE()), { recursive: true });
  await fs.promises.writeFile(tmp, text, 'utf8');
  await fs.promises.rename(tmp, FILE());
  return true;
});
ipcMain.handle('ts:export', async (e, text) => {
  if (typeof text !== 'string' || text.length > MAX) { throw new Error('bad data'); }
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, { defaultPath: 'tactical-scrum.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) { return null; }
  await fs.promises.writeFile(r.filePath, text, 'utf8');
  return r.filePath;
});
ipcMain.handle('ts:import', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) { return null; }
  const st = await fs.promises.stat(r.filePaths[0]);
  if (st.size > MAX) { throw new Error('file too large'); }
  return fs.promises.readFile(r.filePaths[0], 'utf8');
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); } });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') { app.quit(); } });
