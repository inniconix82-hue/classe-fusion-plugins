import React, { useState, useEffect } from 'react'
import { getOllamaModel, setOllamaModel, listModels, checkOllamaStatus } from '../data/ollamaService'

export type OllamaStyle = 'concis' | 'structure' | 'detaille'

interface OllamaPanelProps {
  result: string
  error: string | null
  loading: boolean
  onClose: () => void
  onGenerate: (style: OllamaStyle) => void
  onSendToEditor: (text: string) => void
}

const STYLE_OPTIONS: { value: OllamaStyle; label: string; desc: string }[] = [
  { value: 'concis', label: '⚡ Concis', desc: 'Bullet points, 5 lignes max' },
  { value: 'structure', label: '📐 Structuré', desc: 'Titres + sous-points' },
  { value: 'detaille', label: '📖 Détaillé', desc: 'Paragraphes complets' },
]

const OllamaPanel: React.FC<OllamaPanelProps> = ({
  result,
  error,
  loading,
  onClose,
  onGenerate,
  onSendToEditor,
}) => {
  const [model, setModel] = useState(getOllamaModel())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const [style, setStyle] = useState<OllamaStyle>('concis')

  useEffect(() => {
    checkOllamaStatus().then(setOllamaOnline)
    listModels().then(setAvailableModels)
  }, [])

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

      <div className="ollama-style-selector">
        <label className="ollama-label">Style :</label>
        <div className="ollama-style-options">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`ollama-style-btn ${style === opt.value ? 'active' : ''}`}
              onClick={() => setStyle(opt.value)}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ollama-actions">
        <button
          className="ollama-generate-btn"
          onClick={() => onGenerate(style)}
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

      <div className="ollama-result">
        {error && (
          <div className="ollama-error">
            <span className="ollama-error-icon">⚠️</span>
            <pre className="ollama-error-text">{error}</pre>
          </div>
        )}
        {result ? (
          <>
            <div className="ollama-text">{result}</div>
            <button
              className="ollama-send-editor-btn"
              onClick={() => onSendToEditor(result)}
            >
              📝 Envoyer dans l'éditeur
            </button>
          </>
        ) : !error && !loading ? (
          <div className="ollama-placeholder">
            Cliquez sur "Générer" pour que l'IA analyse vos nodes et génère du contenu.
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default OllamaPanel
