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
  onToggleGoogleDrive: () => void
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
  onToggleGoogleDrive,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    organisation: true,
    'montage-video': false,
    journee: false,
    programme: false,
    'ia-generative': false,
    scenario: false,
    'gestion-projet': false,
    contenu: false,
    business: false,
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
        <button className="gdrive-sidebar-btn" onClick={onToggleGoogleDrive} style={{ flex: 'none', width: '100%' }}>
          <svg width="14" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.85z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-10.2-17.65c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.75h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          Google Drive
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
