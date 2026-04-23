import React, { useState, useEffect, useRef } from 'react'
import { presetCategories, type PresetNode, type PresetCategory } from '../data/presets'
import { loadCustomCategories } from '../data/customCategories'
import { buildEmbeddingIndex, semanticSearch, isEmbeddingReady } from '../data/embeddingService'
import { classifySearchIntent } from '../data/ollamaService'

const SUPER_CATEGORIES: { id: string; name: string; icon: string; categoryIds: string[] }[] = [
  { id: 'perso', name: 'Personnes & Équipe', icon: '👤', categoryIds: ['personnes'] },
  { id: 'productivite', name: 'Productivité', icon: '⚡', categoryIds: ['outils', 'productivite', 'journee'] },
  { id: 'projet', name: 'Gestion de Projet', icon: '🚀', categoryIds: ['gestion-projet'] },
  { id: 'business', name: 'Business', icon: '💼', categoryIds: ['entreprise', 'finance', 'marketing', 'rh'] },
  { id: 'creativite', name: 'Créativité & Médias', icon: '🎨', categoryIds: ['creativite', 'scenario', 'audiovisuel', 'contenu'] },
  { id: 'tech', name: 'Tech & IA', icon: '🤖', categoryIds: ['ia', 'dev'] },
  { id: 'social', name: 'Action Sociale', icon: '🤝', categoryIds: ['action-sociale'] },
  { id: 'educ', name: 'Éducation & Événements', icon: '🎓', categoryIds: ['education', 'evenementiel'] },
  { id: 'detective', name: 'Enquête & Analyse', icon: '🕵️', categoryIds: ['detective'] },
]

interface SidebarProps {
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onAutoLayout: () => void
  layoutDirection: 'TB' | 'LR'
  onToggleDirection: () => void
  onOpenShortcuts: () => void
  onExportPNG: () => void
  onExportPDF: () => void
  onToggleOllama: () => void
  onToggleEditor: () => void
  showMinimap: boolean
  onToggleMinimap: () => void
  onAddUnderlay: () => void
  onShowHelp: () => void
  onManageCategories: () => void
  onOpenTemplates: () => void
  onShowWelcome?: () => void
  activeSuperCatIds?: string[] | null
  theme?: 'dark' | 'light'
  onToggleTheme?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  isNetworkActive?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({
  onSave,
  onLoad,
  onClear,
  onAutoLayout,
  layoutDirection,
  onToggleDirection,
  onOpenShortcuts,
  onExportPNG,
  onExportPDF,
  onToggleOllama,
  onToggleEditor,
  showMinimap,
  onToggleMinimap,
  onAddUnderlay,
  onShowHelp,
  onManageCategories,
  onOpenTemplates,
  onShowWelcome,
  activeSuperCatIds = null,
  theme = 'dark',
  onToggleTheme,
  collapsed = false,
  onToggleCollapse,
  isNetworkActive = false,
}) => {
  const [expandedSuper, setExpandedSuper] = useState<Record<string, boolean>>({})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [focusedSuperCat, setFocusedSuperCat] = useState<string | null>(null)
  const [popoverCatId, setPopoverCatId] = useState<string | null>(null)
  const [showNodesPanel, setShowNodesPanel] = useState(false)

  const [customCategories, setCustomCategories] = useState<PresetCategory[]>(() => loadCustomCategories())

  const visibleSuperCats = activeSuperCatIds
    ? SUPER_CATEGORIES.filter((sc) => activeSuperCatIds.includes(sc.id))
    : SUPER_CATEGORIES

  const [searchQuery, setSearchQuery] = useState('')
  const [semanticMatches, setSemanticMatches] = useState<Set<string>>(new Set())
  const [intentCategories, setIntentCategories] = useState<Set<string>>(new Set())
  const searchTimeoutRef = useRef<number>()

  useEffect(() => {
    const items = presetCategories.flatMap((cat) =>
      cat.nodes.map((n, i) => ({ key: `${cat.id}:${i}`, text: `${n.label} ${n.description}` }))
    )
    buildEmbeddingIndex(items)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSemanticMatches(new Set())
      setIntentCategories(new Set())
      return
    }
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = window.setTimeout(async () => {
      // Semantic embedding search
      if (isEmbeddingReady()) {
        const keys = presetCategories.flatMap((cat) => cat.nodes.map((_, i) => `${cat.id}:${i}`))
        const matches = await semanticSearch(searchQuery, keys)
        setSemanticMatches(matches)
      }
      // Intent classification via LLM
      const catIds = await classifySearchIntent(searchQuery)
      setIntentCategories(new Set(catIds))
    }, 600)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const onDragStart = (event: React.DragEvent, preset: PresetNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(preset))
    event.dataTransfer.effectAllowed = 'move'
  }

  if (collapsed) {
    const allCategories = [...customCategories, ...presetCategories]
    const popoverCat = popoverCatId ? allCategories.find((c) => c.id === popoverCatId) : null

    return (
      <>
        <aside
          className="sidebar sidebar-collapsed"
          onClick={() => {
            if (popoverCatId) { setPopoverCatId(null) }
            else { onToggleCollapse?.() }
          }}
          title={popoverCatId ? 'Fermer' : 'Cliquer pour agrandir'}
        >
          <div className="sidebar-collapsed-icon" title="Agrandir la sidebar">⬡</div>
          <div className="sidebar-collapsed-actions">
            <button title="Sauvegarder" onClick={(e) => { e.stopPropagation(); onSave() }}>💾</button>
            <button title="Ouvrir" onClick={(e) => { e.stopPropagation(); onLoad() }}>📂</button>
            <button title="Ollama IA" onClick={(e) => { e.stopPropagation(); onToggleOllama() }}>🤖</button>
            <button title="Éditeur de document" onClick={(e) => { e.stopPropagation(); onToggleEditor() }}>📝</button>
            <button title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'} onClick={(e) => { e.stopPropagation(); onToggleTheme?.() }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
          <div className="sidebar-collapsed-divider" />
          <div className="sidebar-collapsed-categories">
            {allCategories.map((cat) => (
              <div
                key={cat.id}
                className={`sidebar-collapsed-cat${popoverCatId === cat.id ? ' active' : ''}`}
                title={cat.name}
                style={{ color: cat.color }}
                onClick={(e) => {
                  e.stopPropagation()
                  setPopoverCatId(popoverCatId === cat.id ? null : cat.id)
                }}
              >
                {cat.icon}
              </div>
            ))}
          </div>
          <div className="sidebar-collapsed-network" title={isNetworkActive ? 'Téléchargement en cours' : 'Tout local'}>
            {isNetworkActive ? '🟡' : '🟢'}
          </div>
        </aside>

        {popoverCat && (
          <div className="cat-popover" onClick={(e) => e.stopPropagation()}>
            <div className="cat-popover-header" style={{ color: popoverCat.color }}>
              <span>{popoverCat.icon}</span>
              <span>{popoverCat.name}</span>
              <button className="cat-popover-close" onClick={() => setPopoverCatId(null)}>×</button>
            </div>
            <div className="cat-popover-nodes">
              {popoverCat.nodes.map((preset, i) => (
                <div
                  key={i}
                  className="preset-node"
                  draggable
                  onDragStart={(e) => { onDragStart(e, preset) }}
                  onDragEnd={() => setPopoverCatId(null)}
                  style={{ borderLeftColor: preset.color }}
                >
                  <div className="preset-node-label">{preset.label}</div>
                  <div className="preset-node-desc">{preset.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <aside className="sidebar">
      {/* Main file actions */}
      <div className="sidebar-actions">
        <button className="action-btn action-btn-wide" onClick={onSave} title="Sauvegarder (Ctrl+S)">
          💾 Sauvegarder
        </button>
        <button className="action-btn" onClick={onLoad} title="Ouvrir (Ctrl+O)">
          📂 Ouvrir
        </button>
        <button className="action-btn" onClick={onClear} title="Nouveau (Ctrl+N)">
          🗑️ Nouveau
        </button>
      </div>

      {/* AI + Editor — always visible, full width */}
      <div className="sidebar-main-btns">
        <button className="ollama-sidebar-btn" onClick={onToggleOllama} title="Générer avec Ollama (Ctrl+I)">
          🤖 Générer avec Ollama
        </button>
        <button className="editor-sidebar-btn" onClick={onToggleEditor} title="Éditeur de document (Ctrl+E)">
          📝 Éditeur de document
        </button>
      </div>

      {/* Utility icon row */}
      <div className="sidebar-icon-row">
        <button className="sidebar-icon-btn" onClick={onAutoLayout} title="Auto Layout (Ctrl+L)">🔀</button>
        <button className="sidebar-icon-btn" onClick={onToggleDirection} title={layoutDirection === 'TB' ? 'Passer horizontal (Ctrl+D)' : 'Passer vertical (Ctrl+D)'}>
          {layoutDirection === 'TB' ? '↔' : '↕'}
        </button>
        <div className="sidebar-icon-sep" />
        <button className="sidebar-icon-btn" onClick={onOpenTemplates} title="Templates (Ctrl+T)">📋</button>
        <button className="sidebar-icon-btn" onClick={() => { setCustomCategories(loadCustomCategories()); onManageCategories() }} title="Mes catégories (Ctrl+Shift+C)">🗂️</button>
        <button className="sidebar-icon-btn" onClick={onOpenShortcuts} title="Raccourcis clavier (Ctrl+K)">⌨️</button>
        <div className="sidebar-icon-sep" />
        <button className="sidebar-icon-btn" onClick={onAddUnderlay} title="Ajouter une zone (Ctrl+G)">🟦</button>
        <button className={`sidebar-icon-btn${showMinimap ? ' active' : ''}`} onClick={onToggleMinimap} title={showMinimap ? 'Masquer minimap' : 'Afficher minimap'}>🗺️</button>
        <div className="sidebar-icon-sep" />
        <button className="sidebar-icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="sidebar-icon-btn" onClick={onShowHelp} title="Aide (F1)">❓</button>
        {onShowWelcome && (
          <button className="sidebar-icon-btn" onClick={onShowWelcome} title="Accueil / Changer de mode">🏠</button>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Nodes panel toggle with filter indicator */}
      <button
        className="nodes-panel-toggle"
        onClick={() => setShowNodesPanel((v) => !v)}
      >
        <span>{showNodesPanel ? '▾' : '▸'} Nodes</span>
        {activeSuperCatIds && (
          <span className="nodes-panel-filter-badge" title={`Filtré par mode : ${visibleSuperCats.map(s => s.name).join(', ')}`}>
            🔍 {visibleSuperCats.length} catégorie{visibleSuperCats.length > 1 ? 's' : ''}
          </span>
        )}
      </button>

      {showNodesPanel && (
        <>
          <div className="sidebar-search">
            <input
              className="search-input"
              type="text"
              placeholder="🔍 Rechercher un node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {focusedSuperCat && (
            <div className="sidebar-section-title">
              <button className="focus-reset-btn" onClick={() => setFocusedSuperCat(null)} title="Afficher tout">
                ✕ {visibleSuperCats.find(s => s.id === focusedSuperCat)?.name}
              </button>
            </div>
          )}
        </>
      )}

      <div className="sidebar-categories" style={{ display: showNodesPanel ? undefined : 'none' }}>
        {/* Custom categories first (flat, always visible) */}
        {customCategories.map((category) => {
          const filteredNodes = searchQuery
            ? category.nodes.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.description.toLowerCase().includes(searchQuery.toLowerCase()))
            : category.nodes
          if (searchQuery && filteredNodes.length === 0) return null
          const isExpanded = searchQuery ? true : !!expandedCategories[category.id]
          return (
            <div key={category.id} className="category-group">
              <button className="category-header" onClick={() => toggleCategory(category.id)} style={{ borderLeftColor: category.color }}>
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{filteredNodes.length}</span>
                <span className={`category-chevron ${isExpanded ? 'expanded' : ''}`}>›</span>
              </button>
              {isExpanded && (
                <div className="category-nodes">
                  {filteredNodes.map((preset, i) => (
                    <div key={`${preset.label}-${i}`} className="preset-node" draggable onDragStart={(e) => onDragStart(e, preset)} style={{ borderLeftColor: preset.color }}>
                      <div className="preset-node-label">{preset.label}</div>
                      <div className="preset-node-desc">{preset.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Preset categories grouped by super-category */}
        {visibleSuperCats.map((superCat) => {
          if (focusedSuperCat && focusedSuperCat !== superCat.id) return null
          const cats = presetCategories.filter((c) => superCat.categoryIds.includes(c.id))
          if (cats.length === 0) return null

          // Filter for search (text + semantic embeddings + LLM intent)
          const catsWithNodes = cats.map((cat) => ({
            ...cat,
            filteredNodes: searchQuery
              ? cat.nodes.filter((n, i) => {
                  const textMatch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.description.toLowerCase().includes(searchQuery.toLowerCase())
                  const semMatch = semanticMatches.has(`${cat.id}:${i}`)
                  const intentMatch = intentCategories.has(cat.id)
                  return textMatch || semMatch || intentMatch
                })
              : cat.nodes,
          })).filter((c) => !searchQuery || c.filteredNodes.length > 0)

          if (searchQuery && catsWithNodes.length === 0) return null

          const isSuperExpanded = searchQuery ? true : !!expandedSuper[superCat.id]
          const totalNodes = catsWithNodes.reduce((sum, c) => sum + c.filteredNodes.length, 0)

          return (
            <div key={superCat.id} className="super-category-group">
              <button
                className="super-category-header"
                onClick={() => setExpandedSuper((prev) => {
                  const wasOpen = !!prev[superCat.id]
                  const reset: Record<string, boolean> = {}
                  visibleSuperCats.forEach((sc) => { reset[sc.id] = false })
                  if (!wasOpen) reset[superCat.id] = true
                  return reset
                })}
              >
                <span className="super-cat-icon">{superCat.icon}</span>
                <span className="super-cat-name">{superCat.name}</span>
                <span className="category-count">{totalNodes}</span>
                <button
                  className={`focus-cat-btn${focusedSuperCat === superCat.id ? ' active' : ''}`}
                  title={focusedSuperCat === superCat.id ? 'Afficher tout' : 'Afficher uniquement'}
                  onClick={(e) => { e.stopPropagation(); setFocusedSuperCat(focusedSuperCat === superCat.id ? null : superCat.id) }}
                >
                  {focusedSuperCat === superCat.id ? '✕' : '👁'}
                </button>
                <span className={`category-chevron ${isSuperExpanded ? 'expanded' : ''}`}>›</span>
              </button>

              {isSuperExpanded && catsWithNodes.map((cat) => {
                const isExpanded = searchQuery ? true : !!expandedCategories[cat.id]
                return (
                  <div key={cat.id} className="category-group category-group-nested">
                    <button className="category-header" onClick={() => toggleCategory(cat.id)} style={{ borderLeftColor: cat.color }}>
                      <span className="category-icon">{cat.icon}</span>
                      <span className="category-name">{cat.name}</span>
                      <span className="category-count">{cat.filteredNodes.length}</span>
                      <span className={`category-chevron ${isExpanded ? 'expanded' : ''}`}>›</span>
                    </button>
                    {isExpanded && (
                      <div className="category-nodes">
                        {cat.filteredNodes.map((preset, i) => (
                          <div key={`${preset.label}-${i}`} className="preset-node" draggable onDragStart={(e) => onDragStart(e, preset)} style={{ borderLeftColor: preset.color }}>
                            <div className="preset-node-label">{preset.label}</div>
                            <div className="preset-node-desc">{preset.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <div className="network-indicator" title={isNetworkActive ? 'Téléchargement en cours' : 'Tout fonctionne en local'}>
          <span>{isNetworkActive ? '🟡' : '🟢'}</span>
          <span>{isNetworkActive ? 'Réseau actif' : 'Local'}</span>
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title="Réduire la sidebar">
          ◀
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
