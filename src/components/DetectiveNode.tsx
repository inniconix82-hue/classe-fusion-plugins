import React, { memo, useState, useRef, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useLayoutDirection } from '../data/LayoutContext'

export type DetectiveSubtype = 'suspect' | 'temoin' | 'lieu' | 'indice' | 'hypothese' | 'fait'

export interface DetectiveNodeData {
  label: string
  description: string
  subtype: DetectiveSubtype
  imageData?: string
  score?: number
  color: string
  category: string
  [key: string]: unknown
}

export const SUBTYPE_CONFIG: Record<DetectiveSubtype, { icon: string; label: string; color: string; placeholder: string }> = {
  suspect:   { icon: '🧑', label: 'Suspect',      color: '#ef4444', placeholder: 'Mobile, alibi…' },
  temoin:    { icon: '👁️', label: 'Témoin',       color: '#3b82f6', placeholder: 'Déclaration…' },
  lieu:      { icon: '📍', label: 'Lieu',          color: '#10b981', placeholder: 'Date / heure…' },
  indice:    { icon: '🔍', label: 'Indice',        color: '#eab308', placeholder: 'Description de la preuve…' },
  hypothese: { icon: '❓', label: 'Hypothèse',     color: '#f97316', placeholder: 'Théorie…' },
  fait:      { icon: '✅', label: 'Fait établi',   color: '#64748b', placeholder: 'Source…' },
}

const DetectiveNode = memo(({ data, selected }: NodeProps) => {
  const layoutDir = useLayoutDirection()
  const targetPos = layoutDir === 'LR' ? Position.Left : Position.Top
  const sourcePos = layoutDir === 'LR' ? Position.Right : Position.Bottom
  const d = data as unknown as DetectiveNodeData
  const config = SUBTYPE_CONFIG[d.subtype] ?? SUBTYPE_CONFIG.indice
  const nodeColor = d.color || config.color

  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(d.label || '')
  const [editDesc, setEditDesc] = useState(d.description || '')
  const [editScore, setEditScore] = useState(d.score ?? 5)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => { (data as any).imageData = e.target?.result as string }
    reader.readAsDataURL(file)
  }, [data])

  const saveAndClose = useCallback(() => {
    setIsEditing(false)
    ;(data as any).label = editLabel
    ;(data as any).description = editDesc
    if (d.subtype === 'hypothese') (data as any).score = editScore
  }, [data, editLabel, editDesc, editScore, d.subtype])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (nodeRef.current?.contains(e.relatedTarget as Node)) return
    saveAndClose()
  }, [saveAndClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') { setEditLabel(d.label); setEditDesc(d.description || ''); setIsEditing(false) }
    if (e.key === 'Enter' && !e.shiftKey) saveAndClose()
  }

  const score = d.subtype === 'hypothese' ? (d.score ?? 5) : null
  const scoreColor = score !== null
    ? score >= 7 ? '#ef4444' : score >= 4 ? '#f97316' : '#10b981'
    : nodeColor

  return (
    <div
      ref={nodeRef}
      className={`detective-node detective-${d.subtype} ${selected ? 'selected' : ''}`}
      style={{ '--det-color': nodeColor, '--det-score-color': scoreColor } as React.CSSProperties}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
    >
      <Handle type="target" position={targetPos} className="node-handle" style={{ backgroundColor: nodeColor }} />

      {/* Header */}
      <div className="det-header" style={{ background: nodeColor }}>
        <span className="det-icon">{config.icon}</span>
        <span className="det-type">{config.label}</span>
        {score !== null && (
          <span className="det-score-badge">{score}/10</span>
        )}
      </div>

      {/* Image area */}
      <div
        className={`det-image-area ${isDraggingOver ? 'drag-over' : ''}`}
        onClick={() => !d.imageData && fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f) }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true) }}
        onDragLeave={() => setIsDraggingOver(false)}
      >
        {d.imageData ? (
          <>
            <img src={d.imageData as string} alt={editLabel} className="det-image" draggable={false} />
            <button className="det-image-change" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} title="Changer">↺</button>
          </>
        ) : (
          <div className="det-image-placeholder">
            <span>📷</span>
            <span className="det-image-hint">{isDraggingOver ? 'Déposer' : 'Photo'}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="det-body">
        {isEditing ? (
          <>
            <input
              className="det-input"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={config.label}
              autoFocus
            />
            <textarea
              className="det-textarea"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setIsEditing(false) }}
              placeholder={config.placeholder}
              rows={2}
            />
            {d.subtype === 'hypothese' && (
              <div className="det-score-edit">
                <span className="det-score-label">Probabilité : {editScore}/10</span>
                <input
                  type="range" min={1} max={10} value={editScore}
                  onChange={(e) => setEditScore(Number(e.target.value))}
                  className="det-score-slider"
                  style={{ accentColor: nodeColor }}
                />
              </div>
            )}
            <button className="node-save-btn" onClick={saveAndClose} style={{ marginTop: 4 }}>OK</button>
          </>
        ) : (
          <>
            <div className="det-label">
              {d.label || <em className="det-placeholder">Double-clic pour éditer</em>}
            </div>
            {d.description && <div className="det-desc">{d.description}</div>}
            {score !== null && (
              <div className="det-score-bar">
                <div className="det-score-fill" style={{ width: `${score * 10}%`, background: scoreColor }} />
                <span className="det-score-text">{score}/10</span>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
      />

      <Handle type="source" position={sourcePos} className="node-handle" style={{ backgroundColor: nodeColor }} />
    </div>
  )
})

DetectiveNode.displayName = 'DetectiveNode'
export default DetectiveNode
