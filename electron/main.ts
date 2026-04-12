import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Node Organisation',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'default',
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers for save/load
ipcMain.handle('save-project', async (_event, data: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Sauvegarder le projet',
    defaultPath: 'mon-projet.nodeorg',
    filters: [
      { name: 'Node Organisation', extensions: ['nodeorg'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  })

  if (!result.canceled && result.filePath) {
    writeFileSync(result.filePath, data, 'utf-8')
    return { success: true, path: result.filePath }
  }
  return { success: false }
})

ipcMain.handle('load-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Ouvrir un projet',
    filters: [
      { name: 'Node Organisation', extensions: ['nodeorg'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    properties: ['openFile'],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const content = readFileSync(result.filePaths[0], 'utf-8')
    return { success: true, data: content, path: result.filePaths[0] }
  }
  return { success: false }
})
