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

  return (
    <div
      className={`router-node ${selected ? 'selected' : ''}`}
      style={{ borderColor: color as string }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />

      <div className="router-icon">⬡</div>
      <div className="router-label">{label as string}</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="node-handle"
        style={{ backgroundColor: color as string }}
      />
    </div>
  )
})

RouterNode.displayName = 'RouterNode'
export default RouterNode
