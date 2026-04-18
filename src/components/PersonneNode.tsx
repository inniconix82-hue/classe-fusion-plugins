import React, { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface PersonneNodeData {
  label: string
  description: string
  color: string
  category: string
  [key: string]: unknown
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const PersonneNode = memo(({ data, selected }: NodeProps) => {
  const { label, description, color } = data as unknown as PersonneNodeData
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label as string)
  const [editDesc, setEditDesc] = useState((description as string) || '')
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setEditLabel(label as string)
      setEditDesc((description as string) || '')
    }
  }, [label, description, isEditing])

  const nodeColor = (color as string) || '#7c3aed'

  const saveAndClose = useCallback(() => {
    setIsEditing(false)
    ;(data as any).label = editLabel
    ;(data as any).description = editDesc
  }, [data, editLabel, editDesc])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null
      if (relatedTarget && nodeRef.current?.contains(relatedTarget)) return
      saveAndClose()
    },
    [saveAndClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      setEditLabel(label as string)
      setEditDesc((description as string) || '')
      setIsEditing(false)
    }
    if (e.key === 'Enter') saveAndClose()
  }

  const initials = getInitials(editLabel || label as string || '?')

  return (
    <div
      ref={nodeRef}
      className={`personne-node ${selected ? 'selected' : ''}`}
      style={{ '--personne-color': nodeColor } as React.CSSProperties}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
        style={{ backgroundColor: nodeColor }}
      />

      <div className="personne-avatar" style={{ backgroundColor: nodeColor }}>
        <span className="personne-initials">{initials}</span>
      </div>

      <div className="personne-body">
        {isEditing ? (
          <>
            <input
              className="personne-name-input"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Prénom Nom"
              autoFocus
            />
            <input
              className="personne-role-input"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Fonction / Rôle"
            />
            <button className="node-save-btn" onClick={saveAndClose} tabIndex={0} style={{ marginTop: 4 }}>
              OK
            </button>
          </>
        ) : (
          <>
            <span className="personne-name">
              {(label as string) || <em>Nouveau contact</em>}
            </span>
            {(description as string) ? (
              <span className="personne-role">{description as string}</span>
            ) : (
              <span className="personne-role personne-role-placeholder">Double-clic pour modifier</span>
            )}
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
        style={{ backgroundColor: nodeColor }}
      />
    </div>
  )
})

PersonneNode.displayName = 'PersonneNode'

export default PersonneNode
