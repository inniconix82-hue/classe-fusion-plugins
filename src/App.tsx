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
import StickyNoteNode from './components/StickyNoteNode'
import RouterNode from './components/RouterNode'
import VignetteNode from './components/VignetteNode'
import Sidebar from './components/Sidebar'
import ShortcutsModal from './components/ShortcutsModal'
import OllamaPanel from './components/OllamaPanel'
import TextEditorPanel from './components/TextEditorPanel'
import { type LayoutDirection, getLayoutedElements } from './data/layoutUtils'
import { type PresetNode } from './data/presets'
import { type Shortcut, type NodeShortcut, loadShortcuts, loadNodeShortcuts, matchesShortcut, saveNodeShortcuts } from './data/shortcuts'
import { useHistory } from './data/useHistory'
import { exportToPNG, exportToPDF } from './data/exportUtils'
import { generateFromNodes, askQuestion, type OllamaStyle } from './data/ollamaService'

const nodeTypes = {
  custom: CustomNode,
  sticky: StickyNoteNode,
  router: RouterNode,
  vignette: VignetteNode,
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
  const [nodeShortcuts, setNodeShortcuts] = useState<NodeShortcut[]>(loadNodeShortcuts)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showOllama, setShowOllama] = useState(false)
  const [ollamaResult, setOllamaResult] = useState('')
  const [ollamaError, setOllamaError] = useState<string | null>(null)
  const [ollamaLoading, setOllamaLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editorContent, setEditorContent] = useState('')
  const [questionLoading, setQuestionLoading] = useState(false)
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

      // Determine node type based on preset type
      let nodeType = 'custom'
      if (preset.type === 'sticky') nodeType = 'sticky'
      else if (preset.type === 'router') nodeType = 'router'
      else if (preset.type === 'vignette') nodeType = 'vignette'

      const newNodeId = getNextNodeId()
      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position,
        data: {
          label: preset.label,
          description: preset.description,
          color: preset.color,
          category: preset.category,
        },
      }

      history.push(nodes, edges)

      // Check if dropped on an edge (drop-on-edge to insert node)
      if (nodeType !== 'sticky' && edges.length > 0) {
        const HIT_DISTANCE = 40 // pixels in flow coordinates

        // Find the closest edge to the drop position
        let closestEdge: Edge | null = null
        let closestDist = Infinity

        for (const edge of edges) {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          const targetNode = nodes.find((n) => n.id === edge.target)
          if (!sourceNode || !targetNode) continue

          // Get center-bottom of source (where the edge starts)
          const sw = sourceNode.measured?.width ?? 160
          const sh = sourceNode.measured?.height ?? 60
          const sx = sourceNode.position.x + sw / 2
          const sy = sourceNode.position.y + sh

          // Get center-top of target (where the edge ends)
          const tw = targetNode.measured?.width ?? 160
          const tx = targetNode.position.x + tw / 2
          const ty = targetNode.position.y

          // Distance from drop point to line segment (sx,sy) -> (tx,ty)
          const dx = tx - sx
          const dy = ty - sy
          const lenSq = dx * dx + dy * dy
          if (lenSq === 0) continue

          const dropCenterX = position.x + 80
          const dropCenterY = position.y + 30

          let t = ((dropCenterX - sx) * dx + (dropCenterY - sy) * dy) / lenSq
          t = Math.max(0, Math.min(1, t))

          const projX = sx + t * dx
          const projY = sy + t * dy
          const dist = Math.sqrt(
            (dropCenterX - projX) * (dropCenterX - projX) +
            (dropCenterY - projY) * (dropCenterY - projY)
          )

          if (dist < closestDist) {
            closestDist = dist
            closestEdge = edge
          }
        }

        if (closestEdge && closestDist < HIT_DISTANCE) {
          const edge = closestEdge
          setEdges((eds) => {
            const filtered = eds.filter((e) => e.id !== edge.id)
            const edgeToNew: Edge = {
              id: `e-${edge.source}-${newNodeId}`,
              source: edge.source,
              sourceHandle: edge.sourceHandle || undefined,
              target: newNodeId,
              type: 'custom',
              animated: true,
              data: { label: '' },
              style: { stroke: '#64748b', strokeWidth: 2 },
            }
            const edgeFromNew: Edge = {
              id: `e-${newNodeId}-${edge.target}`,
              source: newNodeId,
              target: edge.target,
              targetHandle: edge.targetHandle || undefined,
              type: 'custom',
              animated: true,
              data: { label: '' },
              style: { stroke: '#64748b', strokeWidth: 2 },
            }
            return [...filtered, edgeToNew, edgeFromNew]
          })
          setNodes((nds) => [...nds, newNode])
          return
        }
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes, setEdges, history, nodes, edges]
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

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = new Set(deletedNodes.map((n) => n.id))
      const bridgeEdges: Edge[] = []

      for (const node of deletedNodes) {
        const incoming = edges.filter((e) => e.target === node.id && !deletedIds.has(e.source))
        const outgoing = edges.filter((e) => e.source === node.id && !deletedIds.has(e.target))

        for (const inEdge of incoming) {
          for (const outEdge of outgoing) {
            bridgeEdges.push({
              id: `e-${inEdge.source}-${outEdge.target}-${Date.now()}`,
              source: inEdge.source,
              target: outEdge.target,
              type: 'custom',
              animated: true,
              data: { label: '' },
              style: { stroke: '#64748b', strokeWidth: 2 },
            })
          }
        }
      }

      if (bridgeEdges.length > 0) {
        setTimeout(() => {
          setEdges((eds) => {
            const existingKeys = new Set(eds.map((e) => `${e.source}-${e.target}`))
            const newEdges = bridgeEdges.filter((e) => !existingKeys.has(`${e.source}-${e.target}`))
            return [...eds, ...newEdges]
          })
        }, 0)
      }
    },
    [edges, setEdges]
  )

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
      const selectedIds = selected.map((n) => n.id)
      clipboardRef.current = selected.map((n) => ({ ...n }))
      // Also copy edges between selected nodes
      clipboardEdgesRef.current = edges.filter(
        (e) => selectedIds.includes(e.source) && selectedIds.includes(e.target)
      ).map((e) => ({ ...e }))
    }
  }, [nodes, edges])

  const clipboardEdgesRef = useRef<Edge[]>([])

  const onPaste = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const offset = 150
    const idMap: Record<string, string> = {}

    const newNodes = clipboardRef.current.map((n) => {
      const newId = getNextNodeId()
      idMap[n.id] = newId
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true,
        data: { ...n.data },
      }
    })

    // Recreate edges between pasted nodes
    const newEdges: Edge[] = clipboardEdgesRef.current
      .filter((e) => idMap[e.source] && idMap[e.target])
      .map((e) => ({
        ...e,
        id: `e-${idMap[e.source]}-${idMap[e.target]}-${Date.now()}`,
        source: idMap[e.source],
        target: idMap[e.target],
        data: { ...e.data },
      }))

    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false })).concat(newNodes)
    )
    if (newEdges.length > 0) {
      setEdges((eds) => [...eds, ...newEdges])
    }

    // Shift clipboard offset for next paste
    clipboardRef.current = clipboardRef.current.map((n) => ({
      ...n,
      position: { x: n.position.x + offset, y: n.position.y + offset },
    }))
  }, [setNodes, setEdges])

  const onExportPNG = useCallback(() => {
    exportToPNG('organisation', nodes)
  }, [nodes])

  const onExportPDF = useCallback(() => {
    exportToPDF('organisation', nodes)
  }, [nodes])

  const onOllamaGenerate = useCallback(async (style: OllamaStyle) => {
    setOllamaLoading(true)
    setOllamaResult('')
    setOllamaError(null)

    const result = await generateFromNodes(nodes, (token) => {
      setOllamaResult((prev) => prev + token)
    }, style)

    if (result.error) {
      setOllamaError(result.error)
    }
    setOllamaLoading(false)
  }, [nodes])

  const onSendToEditor = useCallback((text: string) => {
    const html = text
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `<p>${line}</p>`)
      .join('')
    setEditorContent((prev) => prev + html)
    setShowEditor(true)
    setShowOllama(false)
  }, [])

  const onAskQuestion = useCallback(async (question: string) => {
    setQuestionLoading(true)
    const result = await askQuestion(question)
    setQuestionLoading(false)

    if (result.error) {
      setOllamaError(result.error)
      return
    }

    // Find the last selected node to connect to, or place freely
    const selectedNode = nodes.find((n) => n.selected)
    const baseX = selectedNode ? selectedNode.position.x + 200 : 200 + Math.random() * 300
    const baseY = selectedNode ? selectedNode.position.y + 100 : 200 + Math.random() * 200

    const newId = getNextNodeId()
    const newNode: Node = {
      id: newId,
      type: 'custom',
      position: { x: baseX, y: baseY },
      data: {
        label: result.title,
        description: result.description,
        color: '#8b5cf6',
        category: 'ia',
      },
    }

    history.push(nodes, edges)
    setNodes((nds) => [...nds, newNode])

    // Auto-connect to selected node
    if (selectedNode) {
      const newEdge: Edge = {
        id: `e-${selectedNode.id}-${newId}`,
        source: selectedNode.id,
        target: newId,
        type: 'custom',
        animated: true,
        data: { label: '' },
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      }
      setEdges((eds) => [...eds, newEdge])
    }
  }, [nodes, edges, history, setNodes, setEdges])

  const onDuplicate = useCallback(() => {
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0) return
    const offset = 150
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

      // Node shortcuts
      for (const ns of nodeShortcuts) {
        if (!ns.keys) continue
        if (matchesShortcut(e, ns.keys)) {
          e.preventDefault()
          e.stopImmediatePropagation()
          const newId = getNextNodeId()
          const nodeType = ns.nodeType === 'sticky' ? 'sticky' : ns.nodeType === 'router' ? 'router' : ns.nodeType === 'vignette' ? 'vignette' : 'custom'
          const center = { x: 300, y: 200 }
          history.push(nodes, edges)
          setNodes((nds) => [
            ...nds,
            {
              id: newId,
              type: nodeType,
              position: { x: center.x + Math.random() * 60, y: center.y + Math.random() * 60 },
              data: {
                label: ns.nodeLabel,
                description: '',
                color: ns.nodeColor,
                category: ns.nodeCategory,
              },
            },
          ])
          return
        }
      }
    }
    // Use capture phase to intercept before React Flow swallows the event
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [shortcuts, nodeShortcuts, showShortcuts, onSave, onLoad, onClear, onAutoLayout, onToggleDirection, fitView, onUndo, onRedo, onSelectAll, onCopy, onPaste, onDuplicate, onExportPNG, onExportPDF, onDisconnectSelected, nodes, edges, history, setNodes])

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
        onToggleEditor={() => setShowEditor((v) => !v)}
      />

      {showShortcuts && (
        <ShortcutsModal
          shortcuts={shortcuts}
          onUpdateShortcuts={setShortcuts}
          onUpdateNodeShortcuts={(ns) => { setNodeShortcuts(ns); saveNodeShortcuts(ns) }}
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
          onSendToEditor={onSendToEditor}
          onAskQuestion={onAskQuestion}
          questionLoading={questionLoading}
        />
      )}

      {showEditor && (
        <TextEditorPanel
          onClose={() => setShowEditor(false)}
          initialContent={editorContent}
          onContentChange={setEditorContent}
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
          onNodesDelete={onNodesDelete}
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
