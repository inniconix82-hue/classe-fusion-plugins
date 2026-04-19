import React, { memo, useState, useRef, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useLayoutDirection } from '../data/LayoutContext'

export interface VignetteNodeData {
  label: string
  imageData?: string
  color: string
  category: string
  [key: string]: unknown
}

const VignetteNode = memo(({ data, selected }: NodeProps) => {
  const layoutDir = useLayoutDirection()
  const targetPos = layoutDir === 'LR' ? Position.Left : Position.Top
  const sourcePos = layoutDir === 'LR' ? Position.Right : Position.Bottom
  const { label, imageData, color } = data as unknown as VignetteNodeData
  const [editLabel, setEditLabel] = useState(label as string)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      ;(data as any).imageData = result
    }
    reader.readAsDataURL(file)
  }, [data])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleLabelBlur = () => {
    setIsEditingLabel(false)
    ;(data as any).label = editLabel
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') handleLabelBlur()
    if (e.key === 'Escape') {
      setEditLabel(label as string)
      setIsEditingLabel(false)
    }
  }

  return (
    <div
      className={`vignette-node ${selected ? 'selected' : ''} ${isDraggingOver ? 'drag-over' : ''}`}
      style={{ borderColor: color as string }}
    >
      <Handle
        type="target"
        position={targetPos}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />

      <div
        className="vignette-image-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {imageData ? (
          <img
            src={imageData as string}
            alt={editLabel}
            className="vignette-image"
            draggable={false}
          />
        ) : (
          <div className="vignette-placeholder">
            <span className="vignette-placeholder-icon">🖼️</span>
            <span className="vignette-placeholder-text">
              {isDraggingOver ? 'Déposer ici' : 'Cliquer ou glisser une image'}
            </span>
          </div>
        )}
      </div>

      <div className="vignette-footer">
        {isEditingLabel ? (
          <input
            className="vignette-label-input"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            autoFocus
          />
        ) : (
          <div
            className="vignette-label"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditingLabel(true) }}
          >
            {editLabel || <span className="node-desc-placeholder">Double-clic pour nommer</span>}
          </div>
        )}
        {imageData && (
          <button
            className="vignette-change-btn"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            title="Changer l'image"
          >
            ↺
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Handle
        type="source"
        position={sourcePos}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />
    </div>
  )
})

VignetteNode.displayName = 'VignetteNode'

export default VignetteNode
