import React, { useState, useEffect, useRef } from 'react'
import type { Node } from '@xyflow/react'
import { getOllamaModel, setOllamaModel, listModels, checkOllamaStatus, addToKnowledgeBase, getKnowledgeBase, clearKnowledgeBase, generateGraphFromText } from '../data/ollamaService'
import type { OllamaStyle, PdfGraphResponse } from '../data/ollamaService'
import type { Edge } from '@xyflow/react'

export interface GenerateOptions {
  instructions?: string
  categoryFilter?: string | null
}

interface OllamaPanelProps {
  result: string
  error: string | null
  loading: boolean
  nodes?: Node[]
  onClose: () => void
  onGenerate: (style: OllamaStyle, options?: GenerateOptions) => void
  onSendToEditor: (text: string) => void
  onAskQuestion: (question: string) => void
  questionLoading: boolean
  onDownloadStateChange?: (active: boolean) => void
  onImportFromPdf?: (nodes: Node[], edges: Edge[]) => void
}

const today = new Date().toLocaleDateString('fr-FR')

const EDITOR_TEMPLATES: { icon: string; label: string; wrap: (content: string) => string }[] = [
  {
    icon: '📋',
    label: 'Compte-rendu',
    wrap: (c) => `# Compte-rendu\n\n**Date :** ${today}  \n**Participants :** \n\n## Contenu\n\n${c}\n\n## Décisions\n\n- \n\n## Actions à suivre\n\n- `,
  },
  {
    icon: '📧',
    label: 'Email',
    wrap: (c) => `Madame, Monsieur,\n\n${c}\n\nCordialement,  \n**Votre nom**`,
  },
  {
    icon: '📑',
    label: 'Rapport',
    wrap: (c) => `# Rapport\n\n## Introduction\n\n${c}\n\n## Conclusion\n\n\n\n## Recommandations\n\n- `,
  },
  {
    icon: '💡',
    label: 'Note',
    wrap: (c) => `## Note — ${today}\n\n${c}`,
  },
  {
    icon: '🗂️',
    label: 'Fiche projet',
    wrap: (c) => `# Fiche projet\n\n**Date :** ${today}  \n**Chef de projet :** \n\n## Contexte\n\n${c}\n\n## Objectifs\n\n- \n\n## Jalons\n\n- `,
  },
  {
    icon: '📊',
    label: 'SWOT',
    wrap: (c) => `# Analyse SWOT\n\n${c}\n\n## Forces\n\n- \n\n## Faiblesses\n\n- \n\n## Opportunités\n\n- \n\n## Menaces\n\n- `,
  },
]

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
  nodes = [],
  onClose,
  onGenerate,
  onSendToEditor,
  onAskQuestion,
  questionLoading,
  onDownloadStateChange,
  onImportFromPdf,
}) => {
  const [model, setModel] = useState(getOllamaModel())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const [style, setStyle] = useState<OllamaStyle>('synthese')
  const [question, setQuestion] = useState('')
  const [kbCount, setKbCount] = useState(getKnowledgeBase().length)
  const [activeTab, setActiveTab] = useState<'generate' | 'mindmap' | 'pdf'>('mindmap')
  const [downloadingModels, setDownloadingModels] = useState<Record<string, number>>({})
  const [showMoreModels, setShowMoreModels] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfFileInputRef = useRef<HTMLInputElement>(null)
  const [pdfText, setPdfText] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [pdfGraphResult, setPdfGraphResult] = useState<PdfGraphResponse | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const nodeCategories = Array.from(
    new Set(nodes.filter((n) => n.type !== 'underlay' && n.type !== 'sticky' && n.type !== 'router').map((n) => (n.data as any).category).filter(Boolean))
  ) as string[]

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

  const handlePdfGraphUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfGraphResult(null)
    setPdfFileName(file.name)

    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setPdfPageCount(pdf.numPages)
      let fullText = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((item: any) => item.str).join(' ') + '\n\n'
      }
      setPdfText(fullText.trim())
    } catch {
      setPdfText('')
      setPdfFileName('')
    }
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = ''
  }

  const handleAnalyzePdf = async () => {
    if (!pdfText) return
    setPdfLoading(true)
    setPdfGraphResult(null)
    const result = await generateGraphFromText(pdfText)
    setPdfGraphResult(result)
    setPdfLoading(false)
  }

  const handleImportPdfGraph = () => {
    if (!pdfGraphResult || !onImportFromPdf) return

    let idCounter = Date.now()
    const idMap: Record<string, string> = {}

    const rfNodes: Node[] = pdfGraphResult.nodes.map((n, i) => {
      const newId = `pdf_${idCounter++}`
      idMap[n.id] = newId
      return {
        id: newId,
        type: 'custom',
        position: { x: (i % 4) * 240, y: Math.floor(i / 4) * 140 },
        data: { label: n.label, description: n.description, color: n.color, category: 'pdf' },
      }
    })

    const rfEdges: Edge[] = pdfGraphResult.edges
      .filter((e) => idMap[e.source] && idMap[e.target])
      .map((e, i) => ({
        id: `pdf_edge_${idCounter}_${i}`,
        source: idMap[e.source],
        target: idMap[e.target],
        type: 'custom',
        animated: true,
        data: { label: e.label || '' },
        style: { stroke: '#64748b', strokeWidth: 2 },
      }))

    onImportFromPdf(rfNodes, rfEdges)
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

      <div className="ollama-panel-body">
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
        <button
          className={`ollama-tab ${activeTab === 'pdf' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdf')}
        >
          📄 PDF → Graphe
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

      {activeTab === 'pdf' && (
        <div className="ollama-pdf-section">
          <p className="ollama-pdf-intro">
            Ollama analyse votre PDF et construit automatiquement un graphe de nodes connectés.
          </p>

          <input
            ref={pdfFileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            style={{ display: 'none' }}
            onChange={handlePdfGraphUpload}
          />

          <button
            className="ollama-pdf-upload-btn"
            onClick={() => pdfFileInputRef.current?.click()}
          >
            📂 Choisir un PDF ou fichier texte
          </button>

          {pdfFileName && (
            <div className="ollama-pdf-file-info">
              <span className="ollama-pdf-filename">📄 {pdfFileName}</span>
              {pdfPageCount > 0 && (
                <span className="ollama-pdf-pages">
                  {pdfPageCount} page{pdfPageCount > 1 ? 's' : ''}
                  {pdfPageCount > 20 ? ' (20 analysées)' : ''}
                </span>
              )}
              {pdfText.length > 4000 && (
                <span className="ollama-pdf-truncated">⚠️ Texte tronqué à 4000 caractères</span>
              )}
            </div>
          )}

          {pdfText && (
            <div className="ollama-pdf-preview">
              {pdfText.slice(0, 200)}
              {pdfText.length > 200 ? '…' : ''}
            </div>
          )}

          {pdfText && !pdfLoading && (
            <button
              className="ollama-generate-btn"
              onClick={handleAnalyzePdf}
              disabled={availableModels.length === 0}
            >
              🧠 Analyser et générer le graphe
            </button>
          )}

          {availableModels.length === 0 && pdfText && (
            <div className="ollama-no-model-hint">↑ Installez un modèle pour analyser</div>
          )}

          {pdfLoading && (
            <div className="ollama-pdf-loading">
              <span className="ollama-spinner" />
              Analyse en cours… (peut prendre 30–60 secondes)
            </div>
          )}

          {pdfGraphResult?.error && (
            <div className="ollama-error" style={{ marginTop: 10 }}>
              <span className="ollama-error-icon">⚠️</span>
              <span className="ollama-error-text">{pdfGraphResult.error}</span>
            </div>
          )}

          {pdfGraphResult && !pdfGraphResult.error && pdfGraphResult.nodes.length > 0 && (
            <div className="ollama-pdf-result">
              <div className="ollama-pdf-result-header">
                ✅ {pdfGraphResult.nodes.length} nodes · {pdfGraphResult.edges.length} connexions générés
              </div>
              <div className="ollama-pdf-node-preview">
                {pdfGraphResult.nodes.map((n) => (
                  <div key={n.id} className="ollama-pdf-node-chip" style={{ borderLeftColor: n.color }}>
                    <strong>{n.label}</strong>
                    <span>{n.description}</span>
                  </div>
                ))}
              </div>
              <button className="ollama-pdf-import-btn" onClick={handleImportPdfGraph}>
                ⬇️ Importer sur le canvas
              </button>
            </div>
          )}
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

          {nodeCategories.length > 0 && (
            <div className="ollama-filter-section">
              <label className="ollama-label">Filtrer par catégorie :</label>
              <div className="ollama-filter-btns">
                <button
                  className={`ollama-filter-btn ${categoryFilter === null ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(null)}
                >
                  Tous
                </button>
                {nodeCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`ollama-filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ollama-instructions-section">
            <textarea
              className="ollama-instructions-input"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Instructions spécifiques... ex: uniquement la branche Jean-Claude, uniquement les décisions, ignorer les nodes sans priorité..."
              rows={2}
            />
          </div>

          <div className="ollama-actions">
            <button
              className="ollama-generate-btn"
              onClick={() => onGenerate(style, { instructions: instructions.trim() || undefined, categoryFilter })}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ollama-spinner" />
                  Génération en cours...
                </>
              ) : (
                <>✨ Générer depuis les nodes{categoryFilter ? ` (${categoryFilter})` : ''}</>
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
                <div className="ollama-send-templates">
                  <div className="ollama-send-label">Envoyer dans l'éditeur comme :</div>
                  <div className="ollama-send-grid">
                    {EDITOR_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        className="ollama-send-tpl-btn"
                        onClick={() => onSendToEditor(tpl.wrap(result))}
                        title={`Envoyer formaté en ${tpl.label}`}
                      >
                        {tpl.icon} {tpl.label}
                      </button>
                    ))}
                    <button
                      className="ollama-send-tpl-btn ollama-send-raw"
                      onClick={() => onSendToEditor(result)}
                      title="Envoyer sans mise en page"
                    >
                      ➜ Brut
                    </button>
                  </div>
                </div>
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
    </div>
  )
}

export default OllamaPanel
