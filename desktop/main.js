/**
 * Nye Clock — Electron main process.
 * Loads the web app from NYE_CLOCK_APP_URL (production) or local file in dev.
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const DEFAULT_APP_URL = 'https://nyeclock.pages.dev/';

function getRemoteUrl() {
  const fromEnv = process.env.NYE_CLOCK_APP_URL && String(process.env.NYE_CLOCK_APP_URL).trim();
  const u = fromEnv || DEFAULT_APP_URL;
  return u.endsWith('/') ? u : u + '/';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#080c14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  if (app.isPackaged) {
    win.loadURL(getRemoteUrl());
  } else {
    const localIndex = path.join(__dirname, '..', 'index.html');
    try {
      const fs = require('fs');
      if (fs.existsSync(localIndex)) {
        win.loadFile(localIndex);
      } else {
        win.loadURL(getRemoteUrl());
      }
    } catch (_) {
      win.loadURL(getRemoteUrl());
    }
  }

  win.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
