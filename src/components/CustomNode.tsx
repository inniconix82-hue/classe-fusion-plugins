import React, { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface CustomNodeData {
  label: string
  description: string
  color: string
  category: string
  [key: string]: unknown
}

const categoryIcons: Record<string, string> = {
  organisation: '📋',
  'montage-video': '🎬',
  journee: '☀️',
  'ia-generative': '🤖',
  scenario: '🎭',
  programme: '📅',
}

const CustomNode = memo(({ data, selected }: NodeProps) => {
  const { label, description, color, category } = data as unknown as CustomNodeData
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label as string)
  const [editDesc, setEditDesc] = useState((description as string) || '')
  const labelRef = useRef<HTMLInputElement>(null)

  // Sync with external data changes
  useEffect(() => {
    if (!isEditing) {
      setEditLabel(label as string)
      setEditDesc((description as string) || '')
    }
  }, [label, description, isEditing])

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
    if (e.key === 'Escape') {
      setEditLabel(label as string)
      setEditDesc((description as string) || '')
      setIsEditing(false)
    }
    // Allow Tab to switch between fields
    e.stopPropagation()
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(e)
    if (e.key === 'Enter') {
      saveAndClose()
    }
  }

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(e)
    if (e.key === 'Enter') {
      saveAndClose()
    }
  }

  const icon = categoryIcons[category as string] || '📋'

  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{
        borderColor: color as string,
        borderLeftWidth: '4px',
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />

      <div className="node-header">
        <span
          className="node-category-badge"
          style={{ backgroundColor: `${color}20`, color: color as string }}
        >
          {icon}
        </span>
        {isEditing ? (
          <input
            ref={labelRef}
            className="node-label-input"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={saveAndClose}
            onKeyDown={handleLabelKeyDown}
            placeholder="Nom du node"
            autoFocus
          />
        ) : (
          <span className="node-label">{label as string}</span>
        )}
      </div>

      {isEditing ? (
        <div className="node-description-edit">
          <input
            className="node-desc-input"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            onBlur={saveAndClose}
            onKeyDown={handleDescKeyDown}
            placeholder="Description (optionnel)"
          />
        </div>
      ) : (
        <div
          className="node-description"
          onDoubleClick={handleDoubleClick}
        >
          {(description as string) || <span className="node-desc-placeholder">Double-clic pour ajouter du texte</span>}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />
    </div>
  )
})

CustomNode.displayName = 'CustomNode'

export default CustomNode
