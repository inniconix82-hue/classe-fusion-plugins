import React, { useState, useEffect, useRef } from 'react'
import { getOllamaModel, setOllamaModel, listModels, checkOllamaStatus, addToKnowledgeBase, getKnowledgeBase, clearKnowledgeBase } from '../data/ollamaService'

import type { OllamaStyle } from '../data/ollamaService'

interface OllamaPanelProps {
  result: string
  error: string | null
  loading: boolean
  onClose: () => void
  onGenerate: (style: OllamaStyle) => void
  onSendToEditor: (text: string) => void
  onAskQuestion: (question: string) => void
  questionLoading: boolean
  onDownloadStateChange?: (active: boolean) => void
}

const STYLE_OPTIONS: { value: OllamaStyle; icon: string; label: string; desc: string }[] = [
  { value: 'synthese', icon: '📝', label: 'Synthèse', desc: 'Bullet points concis' },
  { value: 'detaille', icon: '📄', label: 'Détaillé', desc: 'Paragraphes complets' },
  { value: 'reunion', icon: '📋', label: 'Réunion', desc: 'Compte-rendu structuré' },
  { value: 'cours', icon: '🎓', label: 'Cours', desc: 'Pédagogique et clair' },
]

const SUGGESTED_MODELS: { name: string; label: string; desc: string; size: string; primary?: boolean }[] = [
  { name: 'phi3', label: 'Phi-3', desc: 'Rapide et efficace', size: '2.3 Go', primary: true },
  { name: 'tinyllama', label: 'TinyLlama', desc: 'Ultra léger', size: '0.6 Go' },
  { name: 'mistral', label: 'Mistral 7B', desc: 'Très polyvalent', size: '4.1 Go' },
  { name: 'llama3.2', label: 'Llama 3.2', desc: 'Dernière génération', size: '2.0 Go' },
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
  onDownloadStateChange,
}) => {
  const [model, setModel] = useState(getOllamaModel())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const [style, setStyle] = useState<OllamaStyle>('synthese')
  const [question, setQuestion] = useState('')
  const [kbCount, setKbCount] = useState(getKnowledgeBase().length)
  const [activeTab, setActiveTab] = useState<'generate' | 'mindmap'>('mindmap')
  const [downloadingModels, setDownloadingModels] = useState<Record<string, number>>({})
  const [showMoreModels, setShowMoreModels] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadModel = async (modelName: string) => {
    setDownloadingModels((prev) => ({ ...prev, [modelName]: 0 }))
    onDownloadStateChange?.(true)
    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      })
      if (!response.ok) throw new Error()
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const json = JSON.parse(line)
            if (json.total && json.completed) {
              const pct = Math.round((json.completed / json.total) * 100)
              setDownloadingModels((prev) => ({ ...prev, [modelName]: pct }))
            }
          } catch { /* skip */ }
        }
      }
      const updated = await listModels()
      setAvailableModels(updated)
      if (updated.length === 1) handleModelChange(updated[0])
    } catch { /* ignore */ }
    finally {
      setDownloadingModels((prev) => { const n = { ...prev }; delete n[modelName]; return n })
      onDownloadStateChange?.(false)
    }
  }

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
          {ollamaOnline === false && (
            <button
              className="ollama-launch-btn"
              onClick={async () => {
                const api = (window as any).electronAPI
                if (api?.launchOllama) {
                  await api.launchOllama()
                  setTimeout(() => checkOllamaStatus().then(setOllamaOnline), 3000)
                }
              }}
            >
              ▶ Lancer
            </button>
          )}
        </div>
        <button className="ollama-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="ollama-model-selector">
        <label className="ollama-label">Modèles :</label>
        <div className="model-cards-grid">
          {(showMoreModels ? SUGGESTED_MODELS : SUGGESTED_MODELS.filter((m) => m.primary || availableModels.some((a) => a.startsWith(m.name)))).map((m) => {
            const isInstalled = availableModels.some((a) => a.startsWith(m.name))
            const isActive = model.startsWith(m.name)
            const dlProgress = downloadingModels[m.name]
            const isDownloading = dlProgress !== undefined
            return (
              <button
                key={m.name}
                className={`model-card ${isInstalled && isActive ? 'active' : ''} ${isInstalled && !isActive ? 'installed' : ''}`}
                onClick={() => isInstalled ? handleModelChange(availableModels.find((a) => a.startsWith(m.name))!) : !isDownloading && handleDownloadModel(m.name)}
                disabled={isDownloading}
              >
                <span className="model-card-name">{m.label}</span>
                <span className="model-card-desc">{m.desc}</span>
                {isDownloading ? (
                  <div className="model-card-progress">
                    <div className="model-progress-bar">
                      <div className="model-progress-fill" style={{ width: `${dlProgress}%` }} />
                    </div>
                    <span className="model-progress-pct">{dlProgress}%</span>
                  </div>
                ) : isInstalled ? (
                  <span className="model-card-badge">{isActive ? '✅ Actif' : '✔ Installé'}</span>
                ) : (
                  <span className="model-card-size">⬇️ {m.size}</span>
                )}
              </button>
            )
          })}
        </div>
        {!showMoreModels && SUGGESTED_MODELS.some((m) => !m.primary && !availableModels.some((a) => a.startsWith(m.name))) && (
          <button className="model-more-btn" onClick={() => setShowMoreModels(true)}>
            + Autres modèles
          </button>
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

          {availableModels.length === 0 && ollamaOnline === true && (
            <div className="ollama-no-model-hint">
              ↑ Installez un modèle ci-dessus pour commencer
            </div>
          )}

          {error && (
            <div className="ollama-error" style={{ marginTop: 8 }}>
              <span className="ollama-error-icon">⚠️</span>
              <pre className="ollama-error-text">{error}</pre>
            </div>
          )}

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
                📄 Ajouter un fichier
              </button>
              <button
                className="ollama-kb-btn"
                onClick={async () => {
                  const api = (window as any).electronAPI
                  if (api?.openKbFolder) await api.openKbFolder()
                }}
              >
                📁 Dossier
              </button>
              <button
                className="ollama-kb-btn"
                onClick={async () => {
                  const api = (window as any).electronAPI
                  if (!api?.readKbFolder) return
                  const files = await api.readKbFolder()
                  for (const file of files) {
                    const buffer = await api.readFileBuffer(file.path)
                    if (file.name.endsWith('.pdf')) {
                      try {
                        const pdfjsLib = await import('pdfjs-dist')
                        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
                        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
                        let text = ''
                        for (let i = 1; i <= pdf.numPages; i++) {
                          const page = await pdf.getPage(i)
                          const content = await page.getTextContent()
                          text += content.items.map((item: any) => item.str).join(' ') + '\n\n'
                        }
                        addToKnowledgeBase(text)
                      } catch { /* skip */ }
                    } else {
                      addToKnowledgeBase(new TextDecoder().decode(buffer))
                    }
                  }
                  setKbCount(getKnowledgeBase().length)
                }}
              >
                🔄 Recharger dossier
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

      {activeTab === 'generate' && availableModels.length === 0 && (
        <div className="ollama-no-model-hint">↑ Installez un modèle pour générer du texte</div>
      )}

      {activeTab === 'generate' && availableModels.length > 0 && (
        <>
          <div className="ollama-style-selector">
            <label className="ollama-label">Mode de génération :</label>
            <div className="ollama-style-cards">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`ollama-style-card ${style === opt.value ? 'active' : ''}`}
                  onClick={() => setStyle(opt.value)}
                >
                  <span className="style-card-icon">{opt.icon}</span>
                  <span className="style-card-label">{opt.label}</span>
                  <span className="style-card-desc">{opt.desc}</span>
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
