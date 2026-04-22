import React, { useRef } from 'react'
import { importCategoriesFromJSON, saveCustomCategories } from '../data/customCategories'
import type { CustomCategory } from '../data/customCategories'

interface WelcomeScreenProps {
  onManageCategories: () => void
  onEnterApp: () => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onManageCategories, onEnterApp }) => {
  const importRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">⬡</div>
        <h1 className="welcome-title">Node Organisation</h1>
        <p className="welcome-subtitle">Comment voulez-vous commencer ?</p>

        <div className="welcome-cards">
          <button className="welcome-card" onClick={onManageCategories}>
            <div className="welcome-card-icon">🗂️</div>
            <div className="welcome-card-title">Gérer mes catégories</div>
            <div className="welcome-card-desc">
              Créez vos propres catégories de nodes avant de démarrer — idéal pour personnaliser l'outil à votre métier.
            </div>
          </button>

          <button className="welcome-card" onClick={() => importRef.current?.click()}>
            <div className="welcome-card-icon">⬆️</div>
            <div className="welcome-card-title">Importer des catégories</div>
            <div className="welcome-card-desc">
              Chargez un fichier de catégories existant (.json) partagé par votre équipe ou généré par un outil externe.
            </div>
          </button>

          <button className="welcome-card welcome-card-primary" onClick={onEnterApp}>
            <div className="welcome-card-icon">🚀</div>
            <div className="welcome-card-title">Accéder à l'application</div>
            <div className="welcome-card-desc">
              Démarrez directement sur le canvas et organisez vos idées en nodes connectés.
            </div>
          </button>
        </div>

        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

        <button className="welcome-skip" onClick={onEnterApp}>
          Ne plus afficher cet écran au démarrage →
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
