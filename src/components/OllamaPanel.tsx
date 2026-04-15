import React, { useState, useEffect, useRef } from 'react'
import { getOllamaModel, setOllamaModel, listModels, checkOllamaStatus, addToKnowledgeBase, getKnowledgeBase, clearKnowledgeBase } from '../data/ollamaService'

export type OllamaStyle = 'concis' | 'structure' | 'detaille'

interface OllamaPanelProps {
  result: string
  error: string | null
  loading: boolean
  onClose: () => void
  onGenerate: (style: OllamaStyle) => void
  onSendToEditor: (text: string) => void
  onAskQuestion: (question: string) => void
  questionLoading: boolean
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
  onAskQuestion,
  questionLoading,
}) => {
  const [model, setModel] = useState(getOllamaModel())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const [style, setStyle] = useState<OllamaStyle>('concis')
  const [question, setQuestion] = useState('')
  const [kbCount, setKbCount] = useState(getKnowledgeBase().length)
  const [activeTab, setActiveTab] = useState<'generate' | 'mindmap'>('mindmap')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkOllamaStatus().then(setOllamaOnline)
    listModels().then(setAvailableModels)
  }, [])

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    setOllamaModel(newModel)
  }

  const handleAsk = () => {
    if (!question.trim()) return
    onAskQuestion(question.trim())
    setQuestion('')
  }

  const handleQuestionKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
          fullText += pageText + '\n\n'
        }

        addToKnowledgeBase(fullText)
        setKbCount(getKnowledgeBase().length)
      } catch (err) {
        console.error('Erreur lecture PDF:', err)
      }
    } else {
      // Text file
      const text = await file.text()
      addToKnowledgeBase(text)
      setKbCount(getKnowledgeBase().length)
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearKB = () => {
    clearKnowledgeBase()
    setKbCount(0)
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

      {/* Tabs */}
      <div className="ollama-tabs">
        <button
          className={`ollama-tab ${activeTab === 'mindmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('mindmap')}
        >
          🧠 Carte mentale
        </button>
        <button
          className={`ollama-tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          ✨ Générer texte
        </button>
      </div>

      {activeTab === 'mindmap' && (
        <div className="ollama-mindmap-section">
          {/* Question input */}
          <div className="ollama-question-area">
            <textarea
              className="ollama-question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder="Pose une question... (ex: C'est quoi le DEASS ?)"
              rows={2}
            />
            <button
              className="ollama-ask-btn"
              onClick={handleAsk}
              disabled={questionLoading || !question.trim()}
            >
              {questionLoading ? '...' : '→'}
            </button>
          </div>

          <div className="ollama-mindmap-hint">
            Chaque réponse crée un node sur le canvas (2-3 mots)
          </div>

          {/* Knowledge base */}
          <div className="ollama-kb-section">
            <div className="ollama-kb-header">
              <span className="ollama-kb-title">📚 Base de connaissances</span>
              <span className="ollama-kb-count">
                {kbCount > 0 ? `${kbCount} extraits` : 'Vide'}
              </span>
            </div>
            <div className="ollama-kb-actions">
              <button
                className="ollama-kb-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📄 Ajouter un PDF / texte
              </button>
              {kbCount > 0 && (
                <button className="ollama-kb-clear" onClick={handleClearKB}>
                  🗑 Vider
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              style={{ display: 'none' }}
              onChange={handlePDFUpload}
            />
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <>
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
        </>
      )}
    </div>
  )
}

export default OllamaPanel
