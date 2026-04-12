import React, { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface CustomNodeData {
  label: string
  description: string
  color: string
  category: string
  [key: string]: unknown
}

const CustomNode = memo(({ data, selected }: NodeProps) => {
  const { label, description, color, category } = data as unknown as CustomNodeData
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label as string)

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    ;(data as any).label = editLabel
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      ;(data as any).label = editLabel
    }
    if (e.key === 'Escape') {
      setEditLabel(label as string)
      setIsEditing(false)
    }
  }

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
          {category === 'organisation' ? '📋' : category === 'montage-video' ? '🎬' : category === 'journee' ? '☀️' : '📅'}
        </span>
        {isEditing ? (
          <input
            className="node-label-input"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="node-label">{label as string}</span>
        )}
      </div>

      {description && (
        <div className="node-description">{description as string}</div>
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
