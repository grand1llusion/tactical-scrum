'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  where: true,
  load: () => ipcRenderer.invoke('ts:load'),
  save: (text) => ipcRenderer.invoke('ts:save', text),
  exportJson: (text) => ipcRenderer.invoke('ts:export', text),
  importJson: () => ipcRenderer.invoke('ts:import')
});
