import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, shell, globalShortcut, screen } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { spawn, execFile, exec } from 'child_process'

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createTray() {
  // Use a simple 16x16 keyboard emoji as tray icon (fallback to empty image)
  const iconPath = join(__dirname, '../public/icon.png')
  const icon = existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)
  tray.setToolTip('Raccourcis Clavier — ⌘⇧K pour l\'overlay')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⌨️  Ouvrir l\'overlay',
      accelerator: 'CommandOrControl+Shift+K',
      click: () => createOverlayWindow(),
    },
    { type: 'separator' },
    {
      label: '🗂️  Gérer les raccourcis',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createMainWindow()
        }
      },
    },
    { type: 'separator' },
    { label: 'Quitter', role: 'quit' },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => createOverlayWindow())
}

function createMainWindow() {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Raccourcis Clavier',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f172a',
    titleBarStyle: 'default',
    show: false,
  })

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function createWindow() {
  createMainWindow()
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide()
    } else {
      refreshActiveApp()
      overlayWindow.show()
      overlayWindow.focus()
    }
    return
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 720,
    height: 500,
    x: Math.round((width - 720) / 2),
    y: Math.round(height * 0.15),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    hasShadow: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const overlayUrl = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#overlay`
    : `file://${join(__dirname, '../dist/index.html')}#overlay`

  overlayWindow.loadURL(overlayUrl)

  overlayWindow.once('ready-to-show', () => {
    refreshActiveApp()
    overlayWindow?.show()
    overlayWindow?.focus()
  })

  // Hide on blur (click outside)
  overlayWindow.on('blur', () => {
    overlayWindow?.hide()
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

/** Detect the active app and send its slug to the overlay. */
function refreshActiveApp() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return

  if (process.platform === 'darwin') {
    exec(
      `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
      (err, stdout) => {
        if (err) return
        const appName = stdout.trim().toLowerCase()
        const slug = appNameToSlug(appName)
        if (slug) overlayWindow?.webContents.send('active-app', slug)
      }
    )
  } else if (process.platform === 'win32') {
    exec(
      `powershell -command "Get-Process | Where-Object {$_.MainWindowHandle -eq (Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();' -Name WinUser -PassThru)::GetForegroundWindow()} | Select-Object -ExpandProperty Name"`,
      (err, stdout) => {
        if (err) return
        const appName = stdout.trim().toLowerCase()
        const slug = appNameToSlug(appName)
        if (slug) overlayWindow?.webContents.send('active-app', slug)
      }
    )
  }
}

function appNameToSlug(name: string): string | null {
  if (/davinci|resolve/.test(name)) return 'davinci-resolve'
  if (/photoshop/.test(name)) return 'photoshop'
  if (/illustrator/.test(name)) return 'illustrator'
  if (/premiere/.test(name)) return 'premiere-pro'
  if (/after.?effect/.test(name)) return 'after-effects'
  if (/final.?cut/.test(name)) return 'final-cut-pro'
  if (/code|vscode/.test(name)) return 'vscode'
  if (/excel/.test(name)) return 'excel'
  if (/word/.test(name)) return 'word'
  if (/figma/.test(name)) return 'figma'
  if (/blender/.test(name)) return 'blender'
  if (/ableton/.test(name)) return 'ableton'
  return null
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  // Global hotkey Cmd+Shift+K — toggle overlay from any app
  globalShortcut.register('CommandOrControl+Shift+K', () => {
    createOverlayWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Keep app alive in tray — only quit via tray menu
app.on('window-all-closed', () => { /* stay alive */ })

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handler to launch Ollama
ipcMain.handle('launch-ollama', async () => {
  const username = process.env.USERNAME || process.env.USER || 'user'

  if (process.platform === 'win32') {
    // On Windows, Ollama runs as a tray app — launch the exe without args
    const candidates = [
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Ollama\\Ollama.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Programs\\Ollama\\ollama.exe`,
      `C:\\Users\\${username}\\AppData\\Local\\Ollama\\Ollama.exe`,
      `C:\\Program Files\\Ollama\\Ollama.exe`,
    ]
    for (const exePath of candidates) {
      if (!existsSync(exePath)) continue
      try {
        const child = spawn(exePath, [], { detached: true, stdio: 'ignore' })
        child.unref()
        child.on('error', () => {})
        return { success: true, path: exePath }
      } catch { /* try next */ }
    }
    // Fallback: try via shell
    try {
      const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', shell: true })
      child.unref()
      child.on('error', () => {})
      return { success: true }
    } catch { /* ignore */ }
  } else {
    try {
      const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' })
      child.unref()
      child.on('error', () => {})
      return { success: true }
    } catch { /* ignore */ }
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

// IPC handlers for knowledge base folder
ipcMain.handle('get-kb-folder', () => {
  const folder = join(app.getPath('documents'), 'NodeOrganisation', 'Connaissances')
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  return folder
})

ipcMain.handle('open-kb-folder', async () => {
  const folder = join(app.getPath('documents'), 'NodeOrganisation', 'Connaissances')
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  await shell.openPath(folder)
  return folder
})

ipcMain.handle('read-kb-folder', () => {
  const folder = join(app.getPath('documents'), 'NodeOrganisation', 'Connaissances')
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  const files = readdirSync(folder).filter((f) => /\.(pdf|txt|md)$/i.test(f))
  return files.map((f) => ({ name: f, path: join(folder, f) }))
})

ipcMain.handle('read-file-buffer', (_event, filePath: string) => {
  return readFileSync(filePath)
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
