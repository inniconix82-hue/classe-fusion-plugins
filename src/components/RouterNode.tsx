import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface RouterNodeData {
  label: string
  description: string
  color: string
  category: string
  [key: string]: unknown
}

const RouterNode = memo(({ data, selected }: NodeProps) => {
  const { label, color } = data as unknown as RouterNodeData

  const handleStyle = { backgroundColor: color as string }

  return (
    <div
      className={`router-node ${selected ? 'selected' : ''}`}
      style={{ borderColor: color as string }}
    >
      <Handle type="target" position={Position.Top} id="top-in" className="node-handle" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="top-out" className="node-handle" style={handleStyle} />

      <Handle type="target" position={Position.Left} id="left-in" className="node-handle" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left-out" className="node-handle" style={handleStyle} />

      <div className="router-icon">⬡</div>
      <div className="router-label">{label as string}</div>

      <Handle type="target" position={Position.Bottom} id="bottom-in" className="node-handle" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className="node-handle" style={handleStyle} />

      <Handle type="target" position={Position.Right} id="right-in" className="node-handle" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right-out" className="node-handle" style={handleStyle} />
    </div>
  )
})

RouterNode.displayName = 'RouterNode'
export default RouterNode
