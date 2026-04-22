import React, { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useLayoutDirection } from '../data/LayoutContext'

export interface StickyNoteData {
  label: string
  description: string
  color: string
  category: string
  [key: string]: unknown
}

const StickyNoteNode = memo(({ data, selected }: NodeProps) => {
  const layoutDir = useLayoutDirection()
  const targetPos = layoutDir === 'LR' ? Position.Left : Position.Top
  const sourcePos = layoutDir === 'LR' ? Position.Right : Position.Bottom
  const { label, description, color } = data as unknown as StickyNoteData
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label as string)
  const [editDesc, setEditDesc] = useState((description as string) || '')

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const saveAndClose = () => {
    setIsEditing(false)
    ;(data as any).label = editLabel
    ;(data as any).description = editDesc
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      setEditLabel(label as string)
      setEditDesc((description as string) || '')
      setIsEditing(false)
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      saveAndClose()
    }
  }

  return (
    <div
      className={`sticky-note-node ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: `${color as string}20`, borderColor: color as string }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={targetPos} className="node-handle" style={{ backgroundColor: color as string, opacity: 0.6 }} />
      {isEditing ? (
        <div className="sticky-edit">
          <input
            className="sticky-title-input"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titre"
            autoFocus
          />
          <textarea
            className="sticky-text-input"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveAndClose}
            placeholder="Texte..."
            rows={3}
          />
          <button className="node-save-btn" onClick={saveAndClose}>OK</button>
        </div>
      ) : (
        <>
          <div className="sticky-title">{label as string}</div>
          {(description as string) ? (
            <div className="sticky-text">{description as string}</div>
          ) : (
            <div className="sticky-placeholder">Double-clic pour écrire</div>
          )}
        </>
      )}
      <Handle type="source" position={sourcePos} className="node-handle" style={{ backgroundColor: color as string, opacity: 0.6 }} />
    </div>
  )
})

StickyNoteNode.displayName = 'StickyNoteNode'
export default StickyNoteNode
