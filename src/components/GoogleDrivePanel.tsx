import React, { useState, useEffect, useCallback } from 'react'
import {
  authenticate,
  clearAuth,
  isAuthenticated,
  isGoogleLoaded,
  getClientId,
  setClientId,
  getSavedUser,
  listFiles,
  searchFiles,
  downloadFile,
  uploadFile,
  updateFile,
  deleteFile,
  type DriveFile,
  type DriveUser,
} from '../data/googleDriveService'

interface GoogleDrivePanelProps {
  onClose: () => void
  onLoadProject: (data: string) => void
  onGetProjectData: () => string
}

type View = 'main' | 'config'

const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({
  onClose,
  onLoadProject,
  onGetProjectData,
}) => {
  const [view, setView] = useState<View>('main')
  const [clientId, setClientIdState] = useState(getClientId())
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [user, setUser] = useState<DriveUser | null>(getSavedUser())
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [googleLoaded, setGoogleLoaded] = useState(isGoogleLoaded())

  // Check if Google Identity Services is loaded
  useEffect(() => {
    if (!googleLoaded) {
      const interval = setInterval(() => {
        if (isGoogleLoaded()) {
          setGoogleLoaded(true)
          clearInterval(interval)
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [googleLoaded])

  // Fetch files when authenticated
  useEffect(() => {
    if (authenticated) {
      refreshFiles()
    }
  }, [authenticated])

  const refreshFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const driveFiles = searchQuery
        ? await searchFiles(searchQuery)
        : await listFiles()
      setFiles(driveFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const handleConnect = async () => {
    if (!clientId) {
      setView('config')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authenticate()
      setAuthenticated(true)
      setUser(getSavedUser())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    clearAuth()
    setAuthenticated(false)
    setUser(null)
    setFiles([])
    setSelectedFile(null)
  }

  const handleSaveClientId = () => {
    setClientId(clientId)
    setView('main')
    setSuccess('Client ID sauvegardé !')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSaveProject = async () => {
    if (!saveName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = onGetProjectData()
      await uploadFile(saveName, data)
      setShowSaveInput(false)
      setSaveName('')
      setSuccess('Projet sauvegardé sur Google Drive !')
      setTimeout(() => setSuccess(null), 3000)
      await refreshFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFile = async (fileId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = onGetProjectData()
      await updateFile(fileId, data)
      setSuccess('Projet mis à jour !')
      setTimeout(() => setSuccess(null), 3000)
      await refreshFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLoadFile = async (fileId: string) => {
    setLoading(true)
    setError(null)
    try {
      const content = await downloadFile(fileId)
      onLoadProject(content)
      setSuccess('Projet chargé depuis Google Drive !')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    setLoading(true)
    setError(null)
    try {
      await deleteFile(fileId)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (selectedFile === fileId) setSelectedFile(null)
      setSuccess('Fichier supprimé.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    await refreshFiles()
  }

  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoDate
    }
  }

  // ─── Config View ─────────────────────────────────────

  if (view === 'config') {
    return (
      <div className="gdrive-panel">
        <div className="gdrive-panel-header">
          <div className="gdrive-panel-title">
            <span className="gdrive-icon">&#9881;</span>
            <span>Configuration</span>
          </div>
          <button className="gdrive-close-btn" onClick={() => setView('main')}>&#8592;</button>
        </div>

        <div className="gdrive-config-section">
          <div className="gdrive-config-help">
            <p><strong>Comment obtenir un Client ID :</strong></p>
            <ol>
              <li>Allez sur Google Cloud Console</li>
              <li>Créez un projet (ou sélectionnez-en un)</li>
              <li>Activez l'API Google Drive</li>
              <li>Créez des identifiants OAuth 2.0 (type: Application Web)</li>
              <li>Ajoutez votre origine dans les origines JS autorisées</li>
              <li>Copiez le Client ID ci-dessous</li>
            </ol>
          </div>

          <label className="gdrive-label">Client ID Google :</label>
          <input
            className="gdrive-input"
            type="text"
            value={clientId}
            onChange={(e) => setClientIdState(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
          />

          <button
            className="gdrive-action-btn primary"
            onClick={handleSaveClientId}
            disabled={!clientId.trim()}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    )
  }

  // ─── Main View ───────────────────────────────────────

  return (
    <div className="gdrive-panel">
      <div className="gdrive-panel-header">
        <div className="gdrive-panel-title">
          <span className="gdrive-icon">
            <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.85z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-10.2-17.65c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.75h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </span>
          <span>Google Drive</span>
        </div>
        <div className="gdrive-header-actions">
          <button className="gdrive-config-btn" onClick={() => setView('config')} title="Configuration">
            &#9881;
          </button>
          <button className="gdrive-close-btn" onClick={onClose}>&#215;</button>
        </div>
      </div>

      {/* Auth Section */}
      {!authenticated ? (
        <div className="gdrive-auth-section">
          {!googleLoaded && (
            <div className="gdrive-warning">
              Chargement de Google Identity Services...
            </div>
          )}
          {!clientId && (
            <div className="gdrive-warning">
              Configurez votre Client ID Google pour commencer.
              <button className="gdrive-link-btn" onClick={() => setView('config')}>
                Configurer
              </button>
            </div>
          )}
          <button
            className="gdrive-connect-btn"
            onClick={handleConnect}
            disabled={loading || !googleLoaded}
          >
            {loading ? (
              <>
                <span className="gdrive-spinner" />
                Connexion...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.85z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-10.2-17.65c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.75h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
                Se connecter à Google Drive
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* User Info */}
          {user && (
            <div className="gdrive-user-bar">
              {user.picture && (
                <img className="gdrive-avatar" src={user.picture} alt="" />
              )}
              <div className="gdrive-user-info">
                <span className="gdrive-user-name">{user.name}</span>
                <span className="gdrive-user-email">{user.email}</span>
              </div>
              <button className="gdrive-disconnect-btn" onClick={handleDisconnect} title="Déconnecter">
                &#x23FB;
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="gdrive-actions">
            {!showSaveInput ? (
              <button
                className="gdrive-action-btn primary"
                onClick={() => setShowSaveInput(true)}
                disabled={loading}
              >
                &#x2B06; Sauvegarder le projet
              </button>
            ) : (
              <div className="gdrive-save-form">
                <input
                  className="gdrive-input"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Nom du projet..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProject()}
                  autoFocus
                />
                <div className="gdrive-save-btns">
                  <button
                    className="gdrive-action-btn primary small"
                    onClick={handleSaveProject}
                    disabled={loading || !saveName.trim()}
                  >
                    {loading ? <span className="gdrive-spinner" /> : 'Sauvegarder'}
                  </button>
                  <button
                    className="gdrive-action-btn secondary small"
                    onClick={() => { setShowSaveInput(false); setSaveName('') }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="gdrive-search">
            <input
              className="gdrive-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher un fichier..."
            />
            <button className="gdrive-search-btn" onClick={handleSearch} disabled={loading}>
              &#128269;
            </button>
          </div>

          {/* File List */}
          <div className="gdrive-file-list">
            {loading && files.length === 0 && (
              <div className="gdrive-placeholder">
                <span className="gdrive-spinner" /> Chargement...
              </div>
            )}
            {!loading && files.length === 0 && (
              <div className="gdrive-placeholder">
                Aucun projet trouvé dans le dossier "Node Organisation".
                <br />Sauvegardez un projet pour commencer.
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.id}
                className={`gdrive-file-item ${selectedFile === file.id ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.id === selectedFile ? null : file.id)}
              >
                <div className="gdrive-file-info">
                  <span className="gdrive-file-name">{file.name}</span>
                  <span className="gdrive-file-date">{formatDate(file.modifiedTime)}</span>
                </div>
                {selectedFile === file.id && (
                  <div className="gdrive-file-actions">
                    <button
                      className="gdrive-file-btn load"
                      onClick={(e) => { e.stopPropagation(); handleLoadFile(file.id) }}
                      disabled={loading}
                      title="Charger ce projet"
                    >
                      &#x2B07; Charger
                    </button>
                    <button
                      className="gdrive-file-btn update"
                      onClick={(e) => { e.stopPropagation(); handleUpdateFile(file.id) }}
                      disabled={loading}
                      title="Écraser avec le projet actuel"
                    >
                      &#x21BB; Mettre à jour
                    </button>
                    <button
                      className="gdrive-file-btn delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id) }}
                      disabled={loading}
                      title="Supprimer ce fichier"
                    >
                      &#x1F5D1;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Status messages */}
      {error && (
        <div className="gdrive-toast error">
          <span>&#9888;</span> {error}
          <button className="gdrive-toast-close" onClick={() => setError(null)}>&#215;</button>
        </div>
      )}
      {success && (
        <div className="gdrive-toast success">
          <span>&#10003;</span> {success}
        </div>
      )}
    </div>
  )
}

export default GoogleDrivePanel
