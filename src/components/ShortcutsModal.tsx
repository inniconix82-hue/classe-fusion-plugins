import React, { useState, useEffect, useCallback } from 'react'
import {
  type Shortcut,
  defaultShortcuts,
  saveShortcuts,
  formatKeyCombo,
} from '../data/shortcuts'

interface ShortcutsModalProps {
  shortcuts: Shortcut[]
  onUpdateShortcuts: (shortcuts: Shortcut[]) => void
  onClose: () => void
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  shortcuts,
  onUpdateShortcuts,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>(shortcuts)

  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!editingId) return
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

      e.preventDefault()
      e.stopPropagation()

      const combo = formatKeyCombo(e)
      if (!combo || combo === 'Escape') {
        setEditingId(null)
        return
      }

      setLocalShortcuts((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, keys: combo } : s))
      )
      setEditingId(null)
    },
    [editingId]
  )

  useEffect(() => {
    if (editingId) {
      window.addEventListener('keydown', handleKeyCapture, true)
      return () => window.removeEventListener('keydown', handleKeyCapture, true)
    }
  }, [editingId, handleKeyCapture])

  const handleSave = () => {
    saveShortcuts(localShortcuts)
    onUpdateShortcuts(localShortcuts)
    onClose()
  }

  const handleReset = () => {
    const reset = [...defaultShortcuts]
    setLocalShortcuts(reset)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Raccourcis clavier</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

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
