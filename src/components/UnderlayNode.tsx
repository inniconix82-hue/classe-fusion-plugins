import React, { useState, useCallback } from 'react'
import { NodeResizer, Handle, Position, useReactFlow } from '@xyflow/react'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
]

interface UnderlayData {
  label: string
  color: string
  collapsed?: boolean
  collapsedNodeIds?: string[]
}

const UnderlayNode: React.FC<{ id: string; data: UnderlayData; selected: boolean }> = ({ id, data, selected }) => {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data.label || 'Zone')
  const [color, setColor] = useState(data.color || '#6366f1')
  const [showPicker, setShowPicker] = useState(false)
  const collapsed = data.collapsed ?? false

  const handleDoubleClick = useCallback(() => setEditing(true), [])

  const handleBlur = useCallback(() => {
    setEditing(false)
    data.label = label
  }, [label, data])

  const handleColorPick = (c: string) => {
    setColor(c)
    data.color = c
    setShowPicker(false)
  }

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, { collapsed: !collapsed })
  }

  return (
    <div
      className={`underlay-node ${collapsed ? 'collapsed' : ''}`}
      style={{
        background: collapsed ? `${color}30` : `${color}18`,
        border: `2px solid ${color}66`,
        minHeight: collapsed ? 0 : undefined,
      }}
      onDoubleClick={collapsed ? undefined : handleDoubleClick}
    >
      {!collapsed && (
        <NodeResizer
          isVisible={selected}
          minWidth={120}
          minHeight={80}
          lineStyle={{ borderColor: color }}
          handleStyle={{ background: color, border: 'none', width: 10, height: 10, borderRadius: 3 }}
        />
      )}

      <div className="underlay-header" style={{ borderBottom: collapsed ? 'none' : `1px solid ${color}44` }}>
        <button
          className="underlay-collapse-btn"
          style={{ color }}
          onClick={handleToggleCollapse}
          title={collapsed ? 'Déplier' : 'Replier'}
        >
          {collapsed ? '▶' : '▼'}
        </button>

        {editing ? (
          <input
            className="underlay-label-input"
            value={label}
            autoFocus
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleBlur() }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="underlay-label" style={{ color }}>{label}</span>
        )}

        {!collapsed && (
          <>
            <button
              className="underlay-color-btn"
              style={{ background: color }}
              onClick={(e) => { e.stopPropagation(); setShowPicker((v) => !v) }}
            />
            {showPicker && (
              <div className="underlay-color-picker" onClick={(e) => e.stopPropagation()}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className="underlay-color-swatch"
                    style={{ background: c, outline: c === color ? `2px solid white` : 'none' }}
                    onClick={() => handleColorPick(c)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  )
}

export default UnderlayNode
