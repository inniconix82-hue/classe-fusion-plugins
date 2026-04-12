/// <reference types="vite/client" />

interface ElectronAPI {
  saveProject: (data: string) => Promise<{ success: boolean; path?: string }>
  loadProject: () => Promise<{ success: boolean; data?: string; path?: string }>
}

interface Window {
  electronAPI?: ElectronAPI
}
