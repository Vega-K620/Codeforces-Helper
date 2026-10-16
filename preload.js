const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cfDesktop', {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  loadConfig: () => ipcRenderer.invoke('storage:loadConfig'),
  saveConfig: (config) => ipcRenderer.invoke('storage:saveConfig', config),
  getDemoData: (handle) => ipcRenderer.invoke('cf:getDemoData', handle),
  getCachedUser: (handle) => ipcRenderer.invoke('cf:getCachedUser', handle),
  fetchUserData: (payload) => ipcRenderer.invoke('cf:fetchUserData', payload),
  onSyncProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('cf:syncProgress', listener);
    return () => ipcRenderer.removeListener('cf:syncProgress', listener);
  }
});
