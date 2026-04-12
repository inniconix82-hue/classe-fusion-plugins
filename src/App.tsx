import React, { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  type OnConnect,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import CustomNode from './components/CustomNode'
import Sidebar from './components/Sidebar'
import { type LayoutDirection, getLayoutedElements } from './data/layoutUtils'
import { type PresetNode } from './data/presets'

const nodeTypes = {
  custom: CustomNode,
}

let nodeIdCounter = 0
const getNextNodeId = () => `node_${++nodeIdCounter}`

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#64748b', strokeWidth: 2 },
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('TB')
  const { screenToFlowPosition, fitView } = useReactFlow()

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(params, eds)
      )
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const rawData = event.dataTransfer.getData('application/reactflow')
      if (!rawData) return

      const preset: PresetNode = JSON.parse(rawData)

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: getNextNodeId(),
        type: 'custom',
        position,
        data: {
          label: preset.label,
          description: preset.description,
          color: preset.color,
          category: preset.category,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  const onAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      layoutDirection
    )
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2 })
    })
  }, [nodes, edges, layoutDirection, setNodes, setEdges, fitView])

  const onToggleDirection = useCallback(() => {
    const newDirection = layoutDirection === 'TB' ? 'LR' : 'TB'
    setLayoutDirection(newDirection)

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      newDirection
    )
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2 })
    })
  }, [nodes, edges, layoutDirection, setNodes, setEdges, fitView])

  const onSave = useCallback(async () => {
    const projectData = JSON.stringify({ nodes, edges, layoutDirection }, null, 2)

    if (window.electronAPI) {
      await window.electronAPI.saveProject(projectData)
    } else {
      // Fallback: download as file in browser
      const blob = new Blob([projectData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'projet.nodeorg'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [nodes, edges, layoutDirection])

  const onLoad = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadProject()
      if (result.success && result.data) {
        const data = JSON.parse(result.data)
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
        if (data.layoutDirection) setLayoutDirection(data.layoutDirection)
      }
    } else {
      // Fallback: file input in browser
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.nodeorg,.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          const data = JSON.parse(ev.target?.result as string)
          setNodes(data.nodes || [])
          setEdges(data.edges || [])
          if (data.layoutDirection) setLayoutDirection(data.layoutDirection)
        }
        reader.readAsText(file)
      }
      input.click()
    }
  }, [setNodes, setEdges])

  const onClear = useCallback(() => {
    setNodes([])
    setEdges([])
    nodeIdCounter = 0
  }, [setNodes, setEdges])

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, _node: Node) => {
    // Editing is handled inside the CustomNode component
  }, [])

  return (
    <div className="app-container">
      <Sidebar
        onSave={onSave}
        onLoad={onLoad}
        onClear={onClear}
        onAutoLayout={onAutoLayout}
        layoutDirection={layoutDirection}
        onToggleDirection={onToggleDirection}
      />

      <div className="canvas-container" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          className="react-flow-canvas"
          proOptions={{ hideAttribution: false }}
        >
          <Controls position="bottom-right" className="flow-controls" />
          <MiniMap
            position="bottom-left"
            className="flow-minimap"
            nodeColor={(node: Node) => {
              const data = node.data as any
              return data?.color || '#64748b'
            }}
            maskColor="rgba(0, 0, 0, 0.2)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
          />
          <Panel position="top-right" className="panel-info">
            <div className="info-badge">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} connexion{edges.length !== 1 ? 's' : ''}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
