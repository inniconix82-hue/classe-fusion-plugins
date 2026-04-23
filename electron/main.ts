import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { spawn, execFile } from 'child_process'

let mainWindow: BrowserWindow | null = null

function buildMenu() {
  const send = (action: string) => mainWindow?.webContents.send('menu-action', action)
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'Fichier',
      submenu: [
        { label: 'Nouveau', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
        { label: 'Ouvrir…', accelerator: 'CmdOrCtrl+O', click: () => send('load') },
        { label: 'Sauvegarder…', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { type: 'separator' },
        { label: 'Exporter PNG', accelerator: 'CmdOrCtrl+Shift+P', click: () => send('exportpng') },
        { label: 'Exporter PDF', accelerator: 'CmdOrCtrl+Shift+E', click: () => send('exportpdf') },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
        { label: 'Refaire', accelerator: 'CmdOrCtrl+Y', click: () => send('redo') },
        { type: 'separator' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', click: () => send('copy') },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', click: () => send('paste') },
        { label: 'Dupliquer', accelerator: 'CmdOrCtrl+Shift+D', click: () => send('duplicate') },
        { label: 'Tout sélectionner', accelerator: 'CmdOrCtrl+A', click: () => send('selectall') },
      ],
    },
    {
      label: 'Vue',
      submenu: [
        { label: 'Auto Layout', accelerator: 'CmdOrCtrl+L', click: () => send('layout') },
        { label: 'Changer direction', accelerator: 'CmdOrCtrl+D', click: () => send('direction') },
        { label: 'Zoom adapté', accelerator: 'CmdOrCtrl+F', click: () => send('fitview') },
        { type: 'separator' },
        { label: 'Minimap', accelerator: 'CmdOrCtrl+M', click: () => send('minimap') },
        { type: 'separator' },
        { label: 'Mode sombre / clair', click: () => send('theme') },
      ],
    },
    {
      label: 'Outils',
      submenu: [
        { label: 'Ollama IA', accelerator: 'CmdOrCtrl+I', click: () => send('ollama') },
        { label: 'Éditeur de document', accelerator: 'CmdOrCtrl+E', click: () => send('editor') },
        { type: 'separator' },
        { label: 'Templates', accelerator: 'CmdOrCtrl+T', click: () => send('templates') },
        { label: 'Mes catégories', accelerator: 'CmdOrCtrl+Shift+C', click: () => send('categories') },
        { label: 'Raccourcis clavier', accelerator: 'CmdOrCtrl+K', click: () => send('shortcuts') },
        { type: 'separator' },
        { label: 'Ajouter une zone', accelerator: 'CmdOrCtrl+G', click: () => send('addunderlay') },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'Aide', accelerator: 'F1', click: () => send('help') },
        { label: 'Accueil / Changer de mode', click: () => send('welcome') },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  buildMenu()

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
