const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('nyeDesktop', {
  platform: process.platform,
  isDesktop: true
});
