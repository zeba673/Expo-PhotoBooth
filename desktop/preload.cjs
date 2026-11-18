const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('cabina', {
  toggleFullscreen: () => ipcRenderer.invoke('cabina:fullscreen'),
})
