import React, { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [labelText, setLabelText] = useState((data?.label as string) || '')

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    if (data) {
      ;(data as any).label = labelText
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setLabelText((data?.label as string) || '')
      setIsEditing(false)
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? '#6366f1' : '#475569',
          strokeWidth: selected ? 2.5 : 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="edge-label-container"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              className="edge-label-input"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Label..."
            />
          ) : labelText ? (
            <span className="edge-label">{labelText}</span>
          ) : selected ? (
            <span className="edge-label-hint">double-clic</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge
