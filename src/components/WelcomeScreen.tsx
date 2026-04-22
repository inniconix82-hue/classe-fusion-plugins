import React, { useRef, useState } from 'react'
import { importCategoriesFromJSON, saveCustomCategories } from '../data/customCategories'
import { TASK_MODES, type TaskMode } from '../data/presets'
import type { CustomCategory } from '../data/customCategories'

interface WelcomeScreenProps {
  onManageCategories: () => void
  onEnterApp: (taskMode?: TaskMode) => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onManageCategories, onEnterApp }) => {
  const importRef = useRef<HTMLInputElement>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importCategoriesFromJSON(file)
      saveCustomCategories(imported as CustomCategory[])
      alert(`${imported.length} catégorie(s) importée(s) avec succès.`)
      onEnterApp()
    } catch (err: any) {
      alert(`Erreur d'importation : ${err.message}`)
    }
    if (importRef.current) importRef.current.value = ''
  }

  const handleStart = () => {
    const mode = TASK_MODES.find((m) => m.id === selectedTask) ?? undefined
    onEnterApp(mode)
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">⬡</div>
        <h1 className="welcome-title">Node Organisation</h1>
        <p className="welcome-subtitle">Quelle tâche souhaitez-vous réaliser ?</p>

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
            {selectedTask ? `Démarrer — ${TASK_MODES.find(m => m.id === selectedTask)?.name}` : 'Choisir une tâche ci-dessus'}
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

        <button className="welcome-skip" onClick={() => onEnterApp()}>
          Passer et charger tout →
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
