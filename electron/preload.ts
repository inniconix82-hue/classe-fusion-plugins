import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data: string) => ipcRenderer.invoke('save-project', data),
  loadProject: () => ipcRenderer.invoke('load-project'),
  launchOllama: () => ipcRenderer.invoke('launch-ollama'),
  installOllamaLocal: () => ipcRenderer.invoke('install-ollama-local'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openKbFolder: () => ipcRenderer.invoke('open-kb-folder'),
  readKbFolder: () => ipcRenderer.invoke('read-kb-folder'),
  readFileBuffer: (path: string) => ipcRenderer.invoke('read-file-buffer', path),
  // Overlay: receives detected active app slug from main process
  onActiveApp: (callback: (slug: string) => void) => {
    ipcRenderer.on('active-app', (_event, slug: string) => callback(slug))
  },
})
