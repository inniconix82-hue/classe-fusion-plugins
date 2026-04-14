import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import CustomEdge from './components/CustomEdge'
import Sidebar from './components/Sidebar'
import ShortcutsModal from './components/ShortcutsModal'
import OllamaPanel from './components/OllamaPanel'
import GoogleDrivePanel from './components/GoogleDrivePanel'
import { type LayoutDirection, getLayoutedElements } from './data/layoutUtils'
import { type PresetNode } from './data/presets'
import { type Shortcut, loadShortcuts, matchesShortcut } from './data/shortcuts'
import { useHistory } from './data/useHistory'
import { exportToPNG, exportToPDF } from './data/exportUtils'
import { generateFromNodes } from './data/ollamaService'

const nodeTypes = {
  custom: CustomNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

let nodeIdCounter = 0
const getNextNodeId = () => `node_${++nodeIdCounter}`

const defaultEdgeOptions = {
  type: 'custom',
  animated: true,
  data: { label: '' },
  style: { stroke: '#64748b', strokeWidth: 2 },
}

const AUTOSAVE_KEY = 'nodeorg-autosave'

function loadAutoSave(): { nodes: Node[]; edges: Edge[]; layoutDirection?: string } | null {
  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

const saved = loadAutoSave()
const initialNodes: Node[] = saved?.nodes || []
const initialEdges: Edge[] = saved?.edges || []

function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(
    (saved?.layoutDirection as LayoutDirection) || 'TB'
  )
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(loadShortcuts)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showOllama, setShowOllama] = useState(false)
  const [ollamaResult, setOllamaResult] = useState('')
  const [ollamaError, setOllamaError] = useState<string | null>(null)
  const [ollamaLoading, setOllamaLoading] = useState(false)
  const [showGoogleDrive, setShowGoogleDrive] = useState(false)
  const history = useHistory()
  const { screenToFlowPosition, fitView } = useReactFlow()

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      history.push(nodes, edges)
      setEdges((eds: Edge[]) =>
        addEdge(params, eds)
      )
    },
    [setEdges, history, nodes, edges]
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

      history.push(nodes, edges)
      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes, history, nodes, edges]
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
    localStorage.removeItem(AUTOSAVE_KEY)
  }, [setNodes, setEdges])

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, _node: Node) => {
    // Editing is handled inside the CustomNode component
  }, [])

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
    },
    [setEdges]
  )

  const onDisconnectSelected = useCallback(() => {
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id)
    if (selectedNodeIds.length === 0) return
    setEdges((eds) =>
      eds.filter(
        (e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
      )
    )
  }, [nodes, setEdges])

  const onUndo = useCallback(() => {
    history.undo(nodes, edges, setNodes, setEdges)
  }, [history, nodes, edges, setNodes, setEdges])

  const onRedo = useCallback(() => {
    history.redo(nodes, edges, setNodes, setEdges)
  }, [history, nodes, edges, setNodes, setEdges])

  const onSelectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: true }))
    )
  }, [setNodes])

  const clipboardRef = useRef<Node[]>([])

  const onCopy = useCallback(() => {
    const selected = nodes.filter((n) => n.selected)
    if (selected.length > 0) {
      clipboardRef.current = selected.map((n) => ({ ...n }))
    }
  }, [nodes])

  const onPaste = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const offset = 50
    const newNodes = clipboardRef.current.map((n) => ({
      ...n,
      id: getNextNodeId(),
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: true,
      data: { ...n.data },
    }))
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false })).concat(newNodes)
    )
    // Shift clipboard offset for next paste
    clipboardRef.current = clipboardRef.current.map((n) => ({
      ...n,
      position: { x: n.position.x + offset, y: n.position.y + offset },
    }))
  }, [setNodes])

  const onExportPNG = useCallback(() => {
    exportToPNG('organisation')
  }, [])

  const onExportPDF = useCallback(() => {
    exportToPDF('organisation')
  }, [])

  const onOllamaGenerate = useCallback(async () => {
    setOllamaLoading(true)
    setOllamaResult('')
    setOllamaError(null)

    const result = await generateFromNodes(nodes, (token) => {
      setOllamaResult((prev) => prev + token)
    })

    if (result.error) {
      setOllamaError(result.error)
    }
    setOllamaLoading(false)
  }, [nodes])

  const onGoogleDriveLoadProject = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data)
      setNodes(parsed.nodes || [])
      setEdges(parsed.edges || [])
      if (parsed.layoutDirection) setLayoutDirection(parsed.layoutDirection)
    } catch {
      // Invalid JSON
    }
  }, [setNodes, setEdges])

  const onGoogleDriveGetProjectData = useCallback(() => {
    return JSON.stringify({ nodes, edges, layoutDirection }, null, 2)
  }, [nodes, edges, layoutDirection])

  const onDuplicate = useCallback(() => {
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0) return
    const offset = 50
    const newNodes = selected.map((n) => ({
      ...n,
      id: getNextNodeId(),
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: true,
      data: { ...n.data },
    }))
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false })).concat(newNodes)
    )
  }, [nodes, setNodes])

  // Auto-save to localStorage every 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ nodes, edges, layoutDirection })
      )
    }, 3000)
    return () => clearTimeout(timer)
  }, [nodes, edges, layoutDirection])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showShortcuts) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault()
          e.stopImmediatePropagation()
          switch (shortcut.id) {
            case 'save': onSave(); break
            case 'load': onLoad(); break
            case 'new': onClear(); break
            case 'layout': onAutoLayout(); break
            case 'direction': onToggleDirection(); break
            case 'fitview': fitView({ padding: 0.2 }); break
            case 'undo': onUndo(); break
            case 'redo': onRedo(); break
            case 'selectall': onSelectAll(); break
            case 'copy': onCopy(); break
            case 'paste': onPaste(); break
            case 'duplicate': onDuplicate(); break
            case 'exportpng': onExportPNG(); break
            case 'exportpdf': onExportPDF(); break
            case 'disconnect': onDisconnectSelected(); break
          }
          return
        }
      }
    }
    // Use capture phase to intercept before React Flow swallows the event
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [shortcuts, showShortcuts, onSave, onLoad, onClear, onAutoLayout, onToggleDirection, fitView, onUndo, onRedo, onSelectAll, onCopy, onPaste, onDuplicate, onExportPNG, onExportPDF, onDisconnectSelected])

  return (
    <div className="app-container">
      <Sidebar
        onSave={onSave}
        onLoad={onLoad}
        onClear={onClear}
        onAutoLayout={onAutoLayout}
        layoutDirection={layoutDirection}
        onToggleDirection={onToggleDirection}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onExportPNG={onExportPNG}
        onExportPDF={onExportPDF}
        onToggleOllama={() => setShowOllama((v) => !v)}
        onToggleGoogleDrive={() => setShowGoogleDrive((v) => !v)}
      />

      {showShortcuts && (
        <ShortcutsModal
          shortcuts={shortcuts}
          onUpdateShortcuts={setShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {showOllama && (
        <OllamaPanel
          result={ollamaResult}
          error={ollamaError}
          loading={ollamaLoading}
          onClose={() => setShowOllama(false)}
          onGenerate={onOllamaGenerate}
        />
      )}

      {showGoogleDrive && (
        <GoogleDrivePanel
          onClose={() => setShowGoogleDrive(false)}
          onLoadProject={onGoogleDriveLoadProject}
          onGetProjectData={onGoogleDriveGetProjectData}
        />
      )}

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
          onEdgeContextMenu={onEdgeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          className="react-flow-canvas"
          proOptions={{ hideAttribution: true }}
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
