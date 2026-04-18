import React, { useState } from 'react'
import { presetCategories, type PresetNode, type PresetCategory } from '../data/presets'
import { loadCustomCategories } from '../data/customCategories'

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
  collapsed = false,
  onToggleCollapse,
  isNetworkActive = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    personnes: true,
    outils: true,
    productivite: true,
    journee: false,
    'gestion-projet': false,
    entreprise: false,
    finance: false,
    marketing: false,
    rh: false,
    creativite: false,
    scenario: false,
    audiovisuel: false,
    contenu: false,
    ia: false,
    dev: false,
    education: false,
    evenementiel: false,
  })

  const [customCategories, setCustomCategories] = useState<PresetCategory[]>(() => loadCustomCategories())

  const [searchQuery, setSearchQuery] = useState('')

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
    return (
      <aside className="sidebar sidebar-collapsed" onClick={onToggleCollapse} title="Cliquer pour agrandir">
        <div className="sidebar-collapsed-icon" title="Agrandir la sidebar">⬡</div>
        <div className="sidebar-collapsed-actions">
          <button title="Sauvegarder" onClick={(e) => { e.stopPropagation(); onSave() }}>💾</button>
          <button title="Ouvrir" onClick={(e) => { e.stopPropagation(); onLoad() }}>📂</button>
          <button title="Ollama IA" onClick={(e) => { e.stopPropagation(); onToggleOllama() }}>🤖</button>
          <button title="Éditeur de document" onClick={(e) => { e.stopPropagation(); onToggleEditor() }}>📝</button>
        </div>
        <div className="sidebar-collapsed-divider" />
        <div className="sidebar-collapsed-categories">
          {allCategories.map((cat) => (
            <div key={cat.id} className="sidebar-collapsed-cat" title={cat.name} style={{ color: cat.color }}>
              {cat.icon}
            </div>
          ))}
        </div>
        <div className="sidebar-collapsed-network" title={isNetworkActive ? 'Téléchargement en cours' : 'Tout local'}>
          {isNetworkActive ? '🟡' : '🟢'}
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">
          <span className="sidebar-logo">⬡</span>
          Node Organisation
        </h1>
      </div>

      <div className="sidebar-actions">
        <button className="action-btn action-btn-wide" onClick={onSave} title="Sauvegarder">
          <span className="btn-icon">💾</span> Sauvegarder
        </button>
        <button className="action-btn" onClick={onLoad} title="Ouvrir">
          <span className="btn-icon">📂</span> Ouvrir
        </button>
        <button className="action-btn" onClick={onClear} title="Nouveau">
          <span className="btn-icon">🗑️</span> Nouveau
        </button>
      </div>

      <div className="sidebar-actions">
        <button className="action-btn" onClick={onExportPNG} title="Exporter en PNG">
          <span className="btn-icon">🖼️</span> Export PNG
        </button>
        <button className="action-btn" onClick={onExportPDF} title="Exporter en PDF">
          <span className="btn-icon">📄</span> Export PDF
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onAutoLayout} title="Auto-layout">
          <span className="btn-icon">🔀</span> Auto Layout
        </button>
        <button className="layout-btn" onClick={onToggleDirection}>
          {layoutDirection === 'TB' ? '↕ Vertical' : '↔ Horizontal'}
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onOpenShortcuts} style={{ flex: 'none', width: '100%' }}>
          ⌨️ Raccourcis clavier
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="ollama-sidebar-btn" onClick={onToggleOllama} style={{ flex: 'none', width: '100%' }}>
          🤖 Générer avec Ollama
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="editor-sidebar-btn" onClick={onToggleEditor} style={{ flex: 'none', width: '100%' }}>
          📝 Éditeur de document
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onAddUnderlay} style={{ flex: 'none', width: '100%' }}>
          🟦 Ajouter une zone
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onToggleMinimap} style={{ flex: 'none', width: '100%' }}>
          {showMinimap ? '🗺️ Masquer minimap' : '🗺️ Afficher minimap'}
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onShowHelp} style={{ flex: 'none', width: '100%' }}>
          ❓ Aide
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="custom-cats-sidebar-btn" onClick={() => { setCustomCategories(loadCustomCategories()); onManageCategories() }} style={{ flex: 'none', width: '100%' }}>
          🗂️ Mes catégories
        </button>
      </div>

      <div className="sidebar-layout-controls">
        <button className="templates-sidebar-btn" onClick={onOpenTemplates} style={{ flex: 'none', width: '100%' }}>
          🗂️ Templates
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-search">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 Rechercher un node..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-section-title">Glisser un node sur le canvas</div>

      <div className="sidebar-categories">
        {[...customCategories, ...presetCategories].map((category) => {
          const filteredNodes = searchQuery
            ? category.nodes.filter(
                (n) =>
                  n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  n.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : category.nodes

          if (searchQuery && filteredNodes.length === 0) return null

          const isExpanded = searchQuery ? true : expandedCategories[category.id]

          return (
          <div key={category.id} className="category-group">
            <button
              className="category-header"
              onClick={() => toggleCategory(category.id)}
              style={{ borderLeftColor: category.color }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-count">{filteredNodes.length}</span>
              <span
                className={`category-chevron ${
                  isExpanded ? 'expanded' : ''
                }`}
              >
                ›
              </span>
            </button>

            {isExpanded && (
              <div className="category-nodes">
                {filteredNodes.map((preset, index) => (
                  <div
                    key={`${preset.label}-${index}`}
                    className="preset-node"
                    draggable
                    onDragStart={(e) => onDragStart(e, preset)}
                    style={{ borderLeftColor: preset.color }}
                  >
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
