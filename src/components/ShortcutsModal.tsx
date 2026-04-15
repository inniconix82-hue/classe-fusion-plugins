import React, { useState, useEffect, useCallback } from 'react'
import {
  type Shortcut,
  type NodeShortcut,
  defaultShortcuts,
  saveShortcuts,
  saveNodeShortcuts,
  loadNodeShortcuts,
  formatKeyCombo,
} from '../data/shortcuts'
import { presetCategories } from '../data/presets'

interface ShortcutsModalProps {
  shortcuts: Shortcut[]
  onUpdateShortcuts: (shortcuts: Shortcut[]) => void
  onUpdateNodeShortcuts: (shortcuts: NodeShortcut[]) => void
  onClose: () => void
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  shortcuts,
  onUpdateShortcuts,
  onUpdateNodeShortcuts,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNodeKey, setEditingNodeKey] = useState<string | null>(null)
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>(shortcuts)
  const [nodeShortcuts, setNodeShortcuts] = useState<NodeShortcut[]>(loadNodeShortcuts)
  const [activeTab, setActiveTab] = useState<'actions' | 'nodes'>('actions')

  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!editingId && !editingNodeKey) return
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

      e.preventDefault()
      e.stopPropagation()

      const combo = formatKeyCombo(e)

      if (!combo || combo === 'Escape') {
        setEditingId(null)
        setEditingNodeKey(null)
        return
      }

      if (editingId) {
        setLocalShortcuts((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, keys: combo } : s))
        )
        setEditingId(null)
      }

      if (editingNodeKey) {
        setNodeShortcuts((prev) =>
          prev.map((s) =>
            `${s.nodeLabel}__${s.nodeCategory}` === editingNodeKey
              ? { ...s, keys: combo }
              : s
          )
        )
        setEditingNodeKey(null)
      }
    },
    [editingId, editingNodeKey]
  )

  useEffect(() => {
    if (editingId || editingNodeKey) {
      window.addEventListener('keydown', handleKeyCapture, true)
      return () => window.removeEventListener('keydown', handleKeyCapture, true)
    }
  }, [editingId, editingNodeKey, handleKeyCapture])

  // Build the full node list from presets, merged with saved shortcuts
  const allPresetNodes = presetCategories.flatMap((cat) =>
    cat.nodes.map((n) => ({
      nodeLabel: n.label,
      nodeCategory: cat.id,
      nodeColor: n.color,
      nodeType: n.type,
    }))
  )

  const getNodeShortcut = (label: string, category: string): string => {
    const found = nodeShortcuts.find(
      (s) => s.nodeLabel === label && s.nodeCategory === category
    )
    return found?.keys || ''
  }

  const setNodeShortcutKey = (label: string, category: string, color: string, type: string, keys: string) => {
    setNodeShortcuts((prev) => {
      const existing = prev.find((s) => s.nodeLabel === label && s.nodeCategory === category)
      if (existing) {
        return prev.map((s) =>
          s.nodeLabel === label && s.nodeCategory === category ? { ...s, keys } : s
        )
      }
      return [...prev, { nodeLabel: label, nodeCategory: category, nodeColor: color, nodeType: type, keys }]
    })
  }

  const handleSave = () => {
    saveShortcuts(localShortcuts)
    saveNodeShortcuts(nodeShortcuts)
    onUpdateShortcuts(localShortcuts)
    onUpdateNodeShortcuts(nodeShortcuts)
    onClose()
  }

  const handleReset = () => {
    if (activeTab === 'actions') {
      setLocalShortcuts([...defaultShortcuts])
    } else {
      setNodeShortcuts([])
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-content-lg">
        <div className="modal-header">
          <h2>Raccourcis clavier</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="shortcuts-tabs">
          <button
            className={`shortcuts-tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            ⚡ Actions
          </button>
          <button
            className={`shortcuts-tab ${activeTab === 'nodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('nodes')}
          >
            📦 Nodes
          </button>
        </div>

        {activeTab === 'actions' && (
          <div className="shortcuts-list">
            {localShortcuts.map((shortcut) => (
              <div key={shortcut.id} className="shortcut-row">
                <div className="shortcut-info">
                  <span className="shortcut-label">{shortcut.label}</span>
                  <span className="shortcut-desc">{shortcut.description}</span>
                </div>
                <button
                  className={`shortcut-key-btn ${editingId === shortcut.id ? 'recording' : ''}`}
                  onClick={() => setEditingId(editingId === shortcut.id ? null : shortcut.id)}
                >
                  {editingId === shortcut.id ? '... appuie sur les touches ...' : shortcut.keys}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="shortcuts-list">
            <div className="shortcuts-nodes-hint">
              Cliquez sur un bouton pour assigner un raccourci. Laissez vide pour ignorer.
            </div>
            {presetCategories.map((cat) => (
              <div key={cat.id} className="shortcuts-category-group">
                <div className="shortcuts-category-header" style={{ borderLeftColor: cat.color }}>
                  {cat.icon} {cat.name}
                </div>
                {cat.nodes.map((node) => {
                  const nodeKey = `${node.label}__${cat.id}`
                  const currentKeys = getNodeShortcut(node.label, cat.id)
                  const isEditing = editingNodeKey === nodeKey
                  return (
                    <div key={nodeKey} className="shortcut-row">
                      <div className="shortcut-info">
                        <span className="shortcut-label" style={{ color: node.color }}>
                          {node.label}
                        </span>
                        <span className="shortcut-desc">{node.description}</span>
                      </div>
                      <div className="node-shortcut-actions">
                        <button
                          className={`shortcut-key-btn ${isEditing ? 'recording' : ''} ${!currentKeys ? 'empty' : ''}`}
                          onClick={() => setEditingNodeKey(isEditing ? null : nodeKey)}
                        >
                          {isEditing ? '... touche ...' : currentKeys || '+ Ajouter'}
                        </button>
                        {currentKeys && !isEditing && (
                          <button
                            className="node-shortcut-clear"
                            onClick={() => setNodeShortcutKey(node.label, cat.id, node.color, node.type, '')}
                            title="Supprimer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={handleReset}>
            Réinitialiser
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsModal
