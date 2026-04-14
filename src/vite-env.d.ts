/// <reference types="vite/client" />

interface ElectronAPI {
  saveProject: (data: string) => Promise<{ success: boolean; path?: string }>
  loadProject: () => Promise<{ success: boolean; data?: string; path?: string }>
}

interface Window {
  electronAPI?: ElectronAPI
}

// Google Identity Services type declarations
declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string
    expires_in: string
    error?: string
    error_description?: string
    token_type: string
    scope: string
  }

  interface TokenClientConfig {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type: string; message: string }) => void
    prompt?: string
  }

  interface TokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void
  }

  function initTokenClient(config: TokenClientConfig): TokenClient
  function revoke(token: string, callback?: () => void): void
}

declare const google: typeof google
