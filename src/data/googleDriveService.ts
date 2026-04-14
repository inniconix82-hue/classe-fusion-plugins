/**
 * Google Drive Service
 * Handles OAuth 2.0 authentication and Google Drive API v3 operations
 * for saving/loading .nodeorg project files.
 *
 * The user must provide their own Google Cloud Client ID.
 * Instructions:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create a project and enable Google Drive API
 *   3. Create OAuth 2.0 credentials (Web application)
 *   4. Add your app origin to authorized JavaScript origins
 *   5. Paste the Client ID in the Google Drive panel
 */

const STORAGE_KEY_TOKEN = 'nodeorg-gdrive-token'
const STORAGE_KEY_CLIENT_ID = 'nodeorg-gdrive-client-id'
const STORAGE_KEY_USER = 'nodeorg-gdrive-user'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const APP_FOLDER_NAME = 'Node Organisation'
const FILE_MIME = 'application/json'

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
  size?: string
}

export interface DriveUser {
  name: string
  email: string
  picture?: string
}

// ─── Client ID Management ─────────────────────────────────────────

export function getClientId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || ''
  } catch {
    return ''
  }
}

export function setClientId(clientId: string) {
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim())
}

// ─── Token Management ──────────────────────────────────────────────

export function getAccessToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // Check if token is expired
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      localStorage.removeItem(STORAGE_KEY_USER)
      return null
    }
    return parsed.token
  } catch {
    return null
  }
}

function saveAccessToken(token: string, expiresIn: number) {
  const data = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  }
  localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(data))
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_TOKEN)
  localStorage.removeItem(STORAGE_KEY_USER)
  // Revoke token if possible
  const token = getAccessToken()
  if (token) {
    google?.accounts?.oauth2?.revoke(token, () => {})
  }
}

export function getSavedUser(): DriveUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveUser(user: DriveUser) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
}

// ─── Authentication ────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

/**
 * Initiate Google OAuth 2.0 login using Google Identity Services.
 * Returns an access token via the implicit grant flow.
 */
export function authenticate(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = getClientId()
    if (!clientId) {
      reject(new Error('Veuillez configurer votre Client ID Google Cloud.'))
      return
    }

    if (typeof google === 'undefined' || !google.accounts?.oauth2) {
      reject(new Error('Google Identity Services non chargé. Vérifiez votre connexion internet.'))
      return
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error) {
          reject(new Error(`Erreur OAuth: ${response.error}`))
          return
        }
        saveAccessToken(response.access_token, parseInt(response.expires_in))
        // Fetch user info
        fetchUserInfo(response.access_token)
          .then((user) => {
            saveUser(user)
            resolve(response.access_token)
          })
          .catch(() => resolve(response.access_token))
      },
    })

    tokenClient.requestAccessToken()
  })
}

async function fetchUserInfo(token: string): Promise<DriveUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user info')
  const data = await res.json()
  return {
    name: data.name || data.email,
    email: data.email,
    picture: data.picture,
  }
}

// ─── Helper: authorized fetch ──────────────────────────────────────

async function driveRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  if (!token) throw new Error('Non authentifié. Veuillez vous connecter à Google Drive.')

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    clearAuth()
    throw new Error('Session expirée. Veuillez vous reconnecter.')
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erreur Google Drive (${res.status}): ${err}`)
  }
  return res
}

// ─── App Folder Management ─────────────────────────────────────────

async function getOrCreateAppFolder(): Promise<string> {
  // Search for existing folder
  const query = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`
  )
  const data = await res.json()

  if (data.files && data.files.length > 0) {
    return data.files[0].id
  }

  // Create folder
  const createRes = await driveRequest(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const folder = await createRes.json()
  return folder.id
}

// ─── File Operations ───────────────────────────────────────────────

/**
 * List all .nodeorg files from the app's Drive folder.
 */
export async function listFiles(): Promise<DriveFile[]> {
  const folderId = await getOrCreateAppFolder()
  const query = `'${folderId}' in parents and trashed=false`
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&spaces=drive`
  )
  const data = await res.json()
  return (data.files || []) as DriveFile[]
}

/**
 * Search files by name in the app's Drive folder.
 */
export async function searchFiles(query: string): Promise<DriveFile[]> {
  const folderId = await getOrCreateAppFolder()
  const driveQuery = `'${folderId}' in parents and name contains '${query.replace(/'/g, "\\'")}' and trashed=false`
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&spaces=drive`
  )
  const data = await res.json()
  return (data.files || []) as DriveFile[]
}

/**
 * Download a file's content from Google Drive.
 */
export async function downloadFile(fileId: string): Promise<string> {
  const res = await driveRequest(`${DRIVE_API}/files/${fileId}?alt=media`)
  return await res.text()
}

/**
 * Upload a new project file to the app's Drive folder.
 */
export async function uploadFile(fileName: string, content: string): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder()

  // Ensure file has .nodeorg extension
  if (!fileName.endsWith('.nodeorg')) {
    fileName += '.nodeorg'
  }

  const metadata = {
    name: fileName,
    mimeType: FILE_MIME,
    parents: [folderId],
  }

  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append('file', new Blob([content], { type: FILE_MIME }))

  const res = await driveRequest(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
    { method: 'POST', body: form }
  )
  return await res.json()
}

/**
 * Update an existing file's content on Google Drive.
 */
export async function updateFile(fileId: string, content: string): Promise<DriveFile> {
  const form = new FormData()
  form.append('file', new Blob([content], { type: FILE_MIME }))

  const res = await driveRequest(
    `${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=media&fields=id,name,modifiedTime,size`,
    { method: 'PATCH', body: form }
  )
  return await res.json()
}

/**
 * Rename a file on Google Drive.
 */
export async function renameFile(fileId: string, newName: string): Promise<DriveFile> {
  if (!newName.endsWith('.nodeorg')) {
    newName += '.nodeorg'
  }
  const res = await driveRequest(`${DRIVE_API}/files/${fileId}?fields=id,name,modifiedTime,size`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  })
  return await res.json()
}

/**
 * Move a file to trash on Google Drive.
 */
export async function deleteFile(fileId: string): Promise<void> {
  await driveRequest(`${DRIVE_API}/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
}

/**
 * Check if Google Identity Services script is loaded.
 */
export function isGoogleLoaded(): boolean {
  return typeof google !== 'undefined' && !!google.accounts?.oauth2
}
