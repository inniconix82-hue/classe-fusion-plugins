import React, { useState } from 'react'
import { presetCategories, type PresetNode } from '../data/presets'

interface SidebarProps {
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onAutoLayout: () => void
  layoutDirection: 'TB' | 'LR'
  onToggleDirection: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  onSave,
  onLoad,
  onClear,
  onAutoLayout,
  layoutDirection,
  onToggleDirection,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    organisation: true,
    'montage-video': false,
    journee: false,
    programme: false,
    'ia-generative': false,
  })

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

      <div className="sidebar-layout-controls">
        <button className="layout-btn" onClick={onAutoLayout} title="Auto-layout">
          <span className="btn-icon">🔀</span> Auto Layout
        </button>
        <button className="layout-btn" onClick={onToggleDirection}>
          {layoutDirection === 'TB' ? '↕ Vertical' : '↔ Horizontal'}
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section-title">Glisser un node sur le canvas</div>

      <div className="sidebar-categories">
        {presetCategories.map((category) => (
          <div key={category.id} className="category-group">
            <button
              className="category-header"
              onClick={() => toggleCategory(category.id)}
              style={{ borderLeftColor: category.color }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span
                className={`category-chevron ${
                  expandedCategories[category.id] ? 'expanded' : ''
                }`}
              >
                ›
              </span>
            </button>

            {expandedCategories[category.id] && (
              <div className="category-nodes">
                {category.nodes.map((preset, index) => (
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
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
