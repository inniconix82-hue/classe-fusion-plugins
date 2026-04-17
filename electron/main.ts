import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { spawn, execFile } from 'child_process'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // Remove default menu to let all keyboard shortcuts pass through to the renderer
  Menu.setApplicationMenu(null)

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

// IPC handler to launch Ollama
ipcMain.handle('launch-ollama', async () => {
  const username = process.env.USERNAME || process.env.USER || 'user'
  const candidates = process.platform === 'win32'
    ? [
        `C:\\Users\\${username}\\AppData\\Local\\Programs\\Ollama\\ollama.exe`,
        `C:\\Users\\${username}\\AppData\\Local\\Ollama\\ollama.exe`,
        `C:\\Program Files\\Ollama\\ollama.exe`,
        'ollama',
      ]
    : ['ollama']

  for (const cmd of candidates) {
    try {
      if (cmd !== 'ollama' && !existsSync(cmd)) continue
      const child = spawn(cmd, ['serve'], { detached: true, stdio: 'ignore', shell: true })
      child.unref()
      child.on('error', () => {})
      return { success: true, path: cmd }
    } catch { /* try next */ }
  }
  return { success: false }
})

// IPC handler to install Ollama from bundled OllamaSetup.exe
ipcMain.handle('install-ollama-local', async () => {
  const appDir = app.isPackaged
    ? join(app.getAppPath(), '..')
    : join(__dirname, '..')
  const setupPath = join(appDir, 'OllamaSetup.exe')

  if (!existsSync(setupPath)) {
    return { success: false, error: 'OllamaSetup.exe not found' }
  }

  try {
    execFile(setupPath, [], { detached: true })
    return { success: true }
  } catch {
    try {
      spawn(setupPath, [], { detached: true, stdio: 'ignore', shell: true }).unref()
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to launch installer' }
    }
  }
})

// IPC handler to open external URLs
ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url)
  return { success: true }
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
