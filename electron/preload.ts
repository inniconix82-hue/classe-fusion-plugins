import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data: string) => ipcRenderer.invoke('save-project', data),
  loadProject: () => ipcRenderer.invoke('load-project'),
  launchOllama: () => ipcRenderer.invoke('launch-ollama'),
  installOllamaLocal: () => ipcRenderer.invoke('install-ollama-local'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
})
