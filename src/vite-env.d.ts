/// <reference types="vite/client" />

interface ElectronAPI {
  saveProject: (data: string) => Promise<{ success: boolean; path?: string }>
  loadProject: () => Promise<{ success: boolean; data?: string; path?: string }>
  launchOllama?: () => Promise<{ success: boolean }>
  installOllamaLocal?: () => Promise<{ success: boolean; error?: string }>
  openExternal?: (url: string) => Promise<{ success: boolean }>
  openKbFolder?: () => Promise<string>
  readKbFolder?: () => Promise<{ name: string; path: string }[]>
  readFileBuffer?: (path: string) => Promise<Buffer>
  onMenuAction?: (cb: (action: string) => void) => void
}

interface Window {
  electronAPI?: ElectronAPI
}
