import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data: string) => ipcRenderer.invoke('save-project', data),
  saveProjectToPath: (filePath: string, data: string) => ipcRenderer.invoke('save-project-to-path', filePath, data),
  loadProject: () => ipcRenderer.invoke('load-project'),
  launchOllama: () => ipcRenderer.invoke('launch-ollama'),
  installOllamaLocal: () => ipcRenderer.invoke('install-ollama-local'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openKbFolder: () => ipcRenderer.invoke('open-kb-folder'),
  readKbFolder: () => ipcRenderer.invoke('read-kb-folder'),
  readFileBuffer: (path: string) => ipcRenderer.invoke('read-file-buffer', path),
  onMenuAction: (cb: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action) => cb(action))
  },
})
