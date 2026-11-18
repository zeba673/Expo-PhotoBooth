import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { startServer } from '../server.js'

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let window
  const toggleFullscreen = () => window?.setFullScreen(!window.isFullScreen())

  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore()
    window?.focus()
  })
  app.on('window-all-closed', () => app.quit())

  app.whenReady().then(async () => {
    process.chdir(fileURLToPath(new URL('../', import.meta.url)))
    const { port } = await startServer({ production: true })
    const origin = 'http://localhost:' + port
    window = new BrowserWindow({
      title: 'Expo PhotoBooth', width: 1280, height: 820, minWidth: 760, minHeight: 600,
      backgroundColor: '#1c1034', show: false,
      webPreferences: { preload: fileURLToPath(new URL('./preload.cjs', import.meta.url)), sandbox: true, contextIsolation: true },
    })
    const contents = window.webContents
    const trusted = (url) => url === origin || url === origin + '/'
    contents.session.setPermissionCheckHandler((source, permission, requestingOrigin, details) =>
      source === contents && trusted(requestingOrigin) && permission === 'media' && details.mediaType !== 'audio')
    contents.session.setPermissionRequestHandler((source, permission, callback, details) =>
      callback(source === contents && permission === 'media' && trusted(details.requestingUrl) &&
        details.isMainFrame && details.mediaTypes?.length === 1 && details.mediaTypes[0] === 'video'))
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    contents.on('will-navigate', (event) => event.preventDefault())
    ipcMain.handle('cabina:fullscreen', (event) => {
      if (event.sender === contents && trusted(event.senderFrame?.url)) toggleFullscreen()
    })
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Cabina', submenu: [{ label: 'Pantalla completa', accelerator: 'F11', click: toggleFullscreen }, { role: 'quit', label: 'Salir' }] },
    ]))
    contents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape' && window.isFullScreen()) {
        event.preventDefault()
        window.setFullScreen(false)
      }
    })
    window.once('ready-to-show', () => { window.maximize(); window.show() })
    await window.loadURL(origin)
  }).catch((error) => {
    dialog.showErrorBox('No se pudo iniciar Expo PhotoBooth', error.message)
    app.quit()
  })
}
