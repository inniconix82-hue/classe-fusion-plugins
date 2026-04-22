import React, { useRef, useState } from 'react'
import { importCategoriesFromJSON, saveCustomCategories } from '../data/customCategories'
import { TASK_MODES, type TaskMode } from '../data/presets'
import type { CustomCategory } from '../data/customCategories'

interface WelcomeScreenProps {
  onManageCategories: () => void
  onEnterApp: (taskMode?: TaskMode) => void
  onContinue: () => void
  hasAutosave: boolean
  lastTaskMode: TaskMode | null
  isNewProject?: boolean
}

const SKIP_KEY = 'nodeorg-skip-welcome'

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onManageCategories,
  onEnterApp,
  onContinue,
  hasAutosave,
  lastTaskMode,
  isNewProject = false,
}) => {
  const importRef = useRef<HTMLInputElement>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [skipOnStartup, setSkipOnStartup] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importCategoriesFromJSON(file)
      saveCustomCategories(imported as CustomCategory[])
      alert(`${imported.length} catégorie(s) importée(s) avec succès.`)
      maybeSkip()
      onEnterApp()
    } catch (err: any) {
      alert(`Erreur d'importation : ${err.message}`)
    }
    if (importRef.current) importRef.current.value = ''
  }

  const maybeSkip = () => {
    if (skipOnStartup) localStorage.setItem(SKIP_KEY, '1')
    else localStorage.removeItem(SKIP_KEY)
  }

  const handleStart = () => {
    const mode = TASK_MODES.find((m) => m.id === selectedTask) ?? undefined
    maybeSkip()
    onEnterApp(mode)
  }

  const handleContinue = () => {
    maybeSkip()
    onContinue()
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">⬡</div>
        <h1 className="welcome-title">Node Organisation</h1>
        <p className="welcome-title-sub">
          {isNewProject ? 'Nouveau projet — choisissez un mode :' : 'Bienvenue !'}
        </p>

        {hasAutosave && !isNewProject && (
          <div className="welcome-continue-block">
            <button className="welcome-continue-btn" onClick={handleContinue}>
              ▶ Continuer le projet en cours
              {lastTaskMode && (
                <span className="welcome-continue-mode">{lastTaskMode.icon} {lastTaskMode.name}</span>
              )}
            </button>
          </div>
        )}

        <p className="welcome-subtitle">
          {hasAutosave && !isNewProject ? 'Ou démarrer une nouvelle tâche :' : 'Choisissez un mode de travail :'}
        </p>

        <div className="welcome-task-grid">
          {TASK_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`welcome-task-card ${selectedTask === mode.id ? 'selected' : ''} ${mode.id === 'all' ? 'task-all' : ''}`}
              onClick={() => setSelectedTask(mode.id)}
            >
              <span className="welcome-task-icon">{mode.icon}</span>
              <span className="welcome-task-name">{mode.name}</span>
              <span className="welcome-task-desc">{mode.description}</span>
            </button>
          ))}
        </div>

        <div className="welcome-actions">
          <button
            className="welcome-btn-primary"
            onClick={handleStart}
            disabled={!selectedTask}
          >
            {selectedTask
              ? `${isNewProject ? 'Créer' : 'Démarrer'} — ${TASK_MODES.find(m => m.id === selectedTask)?.name}`
              : 'Choisir un mode ci-dessus'}
          </button>

          <div className="welcome-secondary-actions">
            <button className="welcome-btn-secondary" onClick={onManageCategories}>
              🗂️ Gérer mes catégories
            </button>
            <button className="welcome-btn-secondary" onClick={() => importRef.current?.click()}>
              ⬆️ Importer des catégories
            </button>
          </div>
        </div>

        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

        {!isNewProject && (
          <label className="welcome-skip-label">
            <input
              type="checkbox"
              checked={skipOnStartup}
              onChange={(e) => setSkipOnStartup(e.target.checked)}
              className="welcome-skip-checkbox"
            />
            Ne plus afficher au démarrage
          </label>
        )}
      </div>
    </div>
  )
}

export { SKIP_KEY }
export default WelcomeScreen
