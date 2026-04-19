import React, { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'

export const LINK_TYPES: Record<string, { label: string; color: string; dashed: boolean }> = {
  lié:        { label: 'Est lié à',          color: '#94a3b8', dashed: false },
  confirme:   { label: 'Confirme',            color: '#10b981', dashed: false },
  contredit:  { label: 'Contredit',           color: '#ef4444', dashed: false },
  suspecte:   { label: 'Suspecté par',        color: '#f97316', dashed: false },
  present:    { label: 'Présent sur le lieu', color: '#3b82f6', dashed: false },
  non_etabli: { label: 'Non établi',          color: '#64748b', dashed: true  },
}

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

  const linkType = (data?.linkType as string) || null
  const lt = linkType ? LINK_TYPES[linkType] : null
  const edgeColor = selected ? '#6366f1' : (lt?.color ?? '#475569')
  const strokeDash = lt?.dashed ? '6 4' : undefined

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    if (data) (data as any).label = labelText
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setLabelText((data?.label as string) || ''); setIsEditing(false) }
  }

  const displayLabel = labelText || (lt ? lt.label : '')

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: strokeDash,
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
          ) : displayLabel ? (
            <span className="edge-label" style={lt ? { color: lt.color, borderColor: lt.color } : undefined}>
              {displayLabel}
            </span>
          ) : selected ? (
            <span className="edge-label-hint">double-clic</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge
