import React, { useState } from 'react'
import { presetCategories, type PresetNode } from '../data/presets'

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
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">
          <span className="sidebar-logo">⬡</span>
          Node Organisation
        </h1>
      </div>

      <div className="sidebar-actions">
        <button className="action-btn" onClick={onSave} title="Sauvegarder">
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
        {presetCategories.map((category) => {
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
    </aside>
  )
}

export default Sidebar
