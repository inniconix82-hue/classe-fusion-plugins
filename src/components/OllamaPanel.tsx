import React, { useState, useEffect, useRef } from 'react'
import { getOllamaModel, setOllamaModel, listModels, checkOllamaStatus } from '../data/ollamaService'

interface OllamaPanelProps {
  result: string
  error: string | null
  loading: boolean
  onClose: () => void
  onGenerate: () => void
}

const OllamaPanel: React.FC<OllamaPanelProps> = ({
  result,
  error,
  loading,
  onClose,
  onGenerate,
}) => {
  const [model, setModel] = useState(getOllamaModel())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkOllamaStatus().then(setOllamaOnline)
    listModels().then(setAvailableModels)
  }, [])

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight
    }
  }, [result])

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    setOllamaModel(newModel)
  }

  return (
    <div className="ollama-panel">
      <div className="ollama-panel-header">
        <div className="ollama-panel-title">
          <span className="ollama-icon">🤖</span>
          <span>Ollama AI</span>
          <span className={`ollama-status ${ollamaOnline === true ? 'online' : ollamaOnline === false ? 'offline' : 'checking'}`}>
            {ollamaOnline === true ? 'Connecté' : ollamaOnline === false ? 'Hors ligne' : '...'}
          </span>
        </div>
        <button className="ollama-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="ollama-model-selector">
        <label className="ollama-label">Modèle :</label>
        {availableModels.length > 0 ? (
          <select
            className="ollama-select"
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        ) : (
          <input
            className="ollama-model-input"
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            placeholder="mistral"
          />
        )}
      </div>

      <div className="ollama-actions">
        <button
          className="ollama-generate-btn"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="ollama-spinner" />
              Génération en cours...
            </>
          ) : (
            <>✨ Générer depuis les nodes</>
          )}
        </button>
      </div>

      <div className="ollama-result" ref={resultRef}>
        {error && (
          <div className="ollama-error">
            <span className="ollama-error-icon">⚠️</span>
            <pre className="ollama-error-text">{error}</pre>
          </div>
        )}
        {result ? (
          <div className="ollama-text">{result}</div>
        ) : !error && !loading ? (
          <div className="ollama-placeholder">
            Cliquez sur "Générer" pour que l'IA analyse vos nodes et génère du contenu scénaristique.
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default OllamaPanel
