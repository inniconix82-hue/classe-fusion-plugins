import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Controls,
  ControlButton,
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
import { LINK_TYPES } from './components/CustomEdge'
import StickyNoteNode from './components/StickyNoteNode'
import RouterNode from './components/RouterNode'
import VignetteNode from './components/VignetteNode'
import UnderlayNode from './components/UnderlayNode'
import PersonneNode from './components/PersonneNode'
import DetectiveNode from './components/DetectiveNode'
import HelpModal from './components/HelpModal'
import Sidebar from './components/Sidebar'
import ShortcutsModal from './components/ShortcutsModal'
import OllamaPanel from './components/OllamaPanel'
import TextEditorPanel from './components/TextEditorPanel'
import { type LayoutDirection, getLayoutedElements } from './data/layoutUtils'
import { LayoutContext } from './data/LayoutContext'
import { type PresetNode, type TaskMode, TASK_MODES } from './data/presets'
import { type Shortcut, type NodeShortcut, loadShortcuts, loadNodeShortcuts, matchesShortcut, saveNodeShortcuts } from './data/shortcuts'
import { useHistory } from './data/useHistory'
import { exportToPNG, exportToPDF } from './data/exportUtils'
import { generateFromNodes, askQuestion, hasInstalledModels, type OllamaStyle } from './data/ollamaService'
import { marked } from 'marked'
import type { GenerateOptions } from './components/OllamaPanel'
import TemplatesModal from './components/TemplatesModal'
import QuickSearchModal from './components/QuickSearchModal'
import SetupWizard from './components/SetupWizard'
import CustomCategoriesModal from './components/CustomCategoriesModal'
import WelcomeScreen, { SKIP_KEY } from './components/WelcomeScreen'
import { loadCustomCategories, saveCustomCategories } from './data/customCategories'

const nodeTypes = {
  custom: CustomNode,
  sticky: StickyNoteNode,
  router: RouterNode,
  vignette: VignetteNode,
  underlay: UnderlayNode,
  personne: PersonneNode,
  detective: DetectiveNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

let nodeIdCounter = 0
const getNextNodeId = () => `node_${++nodeIdCounter}`

function findFreePosition(
  baseX: number,
  baseY: number,
  existingNodes: Node[],
  nodeW = 180,
  nodeH = 80
): { x: number; y: number } {
  const GAP = 20
  const SW = nodeW + GAP
  const SH = nodeH + GAP
  const candidates = [
    [0, 0], [SW, 0], [-SW, 0], [0, SH], [0, -SH],
    [SW, SH], [-SW, SH], [SW, -SH], [-SW, -SH],
    [2 * SW, 0], [-2 * SW, 0], [0, 2 * SH], [0, -2 * SH],
    [2 * SW, SH], [-2 * SW, SH],
  ]
  for (const [dx, dy] of candidates) {
    const x = baseX + dx
    const y = baseY + dy
    const overlaps = existingNodes.some((n) => {
      const nw = (n.measured?.width as number) ?? nodeW
      const nh = (n.measured?.height as number) ?? nodeH
      return (
        x < n.position.x + nw + GAP &&
        x + nodeW + GAP > n.position.x &&
        y < n.position.y + nh + GAP &&
        y + nodeH + GAP > n.position.y
      )
    })
    if (!overlaps) return { x, y }
  }
  return { x: baseX + Math.random() * 300 + 100, y: baseY + Math.random() * 200 + 100 }
}

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
  const underlayDragRef = useRef<{
    underlayId: string
    startPos: { x: number; y: number }
    containedIds: string[]
    containedStartPositions: Record<string, { x: number; y: number }>
  } | null>(null)
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
  const [rawMarkdown, setRawMarkdown] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('nodeorg-theme') as 'dark' | 'light') || 'dark' } catch { return 'dark' }
  })
  const [showHelp, setShowHelp] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showCustomCategories, setShowCustomCategories] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(SKIP_KEY) } catch { return true }
  })
  const [isNewProject, setIsNewProject] = useState(false)
  const [activeTaskMode, setActiveTaskMode] = useState<TaskMode | null>(() => {
    try {
      const saved = localStorage.getItem('nodeorg-last-task-mode')
      if (saved) return TASK_MODES.find((m) => m.id === saved) ?? null
    } catch {}
    return null
  })
  const [nodeContextMenu, setNodeContextMenu] = useState<{ x: number; y: number; node: Node } | null>(null)
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edge: Edge } | null>(null)
  const [connectMenu, setConnectMenu] = useState<{
    screenX: number; screenY: number
    flowX: number; flowY: number
    fromNodeId: string
    fromHandleId?: string | null
  } | null>(null)
  const [saveToCategoryPicker, setSaveToCategoryPicker] = useState<Node | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isNetworkActive, setIsNetworkActive] = useState(false)
  const history = useHistory()

  useEffect(() => {
    if (showEditor || showOllama) setSidebarCollapsed(true)
  }, [showEditor, showOllama])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nodeorg-theme', theme)
  }, [theme])

  useEffect(() => {
    const wizardDone = localStorage.getItem('nodeorg-setup-done')
    if (wizardDone) return
    hasInstalledModels().then((has) => {
      if (!has) setShowSetupWizard(true)
    })
  }, [])

  // Hide/show nodes when an underlay is collapsed/expanded
  useEffect(() => {
    const underlays = nodes.filter((n) => n.type === 'underlay')
    if (underlays.length === 0) return

    setNodes((nds) => {
      let changed = false
      const updated = nds.map((n) => {
        if (n.type === 'underlay') return n
        let shouldHide = false
        for (const u of underlays) {
          const d = u.data as any
          if (!d.collapsed) continue
          const uw = u.measured?.width ?? 300
          const uh = u.measured?.height ?? 200
          const nw = n.measured?.width ?? 180
          const nh = n.measured?.height ?? 80
          const cx = n.position.x + nw / 2
          const cy = n.position.y + nh / 2
          if (cx >= u.position.x && cx <= u.position.x + uw && cy >= u.position.y && cy <= u.position.y + uh) {
            shouldHide = true
            break
          }
        }
        const currentHidden = !!(n as any).hidden
        if (shouldHide !== currentHidden) { changed = true; return { ...n, hidden: shouldHide } }
        return n
      })
      return changed ? updated : nds
    })
  }, [nodes.map((n) => n.type === 'underlay' ? (n.data as any).collapsed : null).join(',')])
  const { screenToFlowPosition, fitView } = useReactFlow()

  // Track last pane click position (flow coordinates) for contextual node placement
  const lastClickPosRef = useRef<{ x: number; y: number }>({ x: 300, y: 200 })

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    lastClickPosRef.current = pos
    setNodeContextMenu(null)
    setEdgeContextMenu(null)
    setConnectMenu(null)
  }, [screenToFlowPosition])

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: any) => {
    // Only show menu when dropped in empty space (no valid target)
    if (connectionState.isValid || !connectionState.fromNode) return
    const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches[0].clientX
    const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches[0].clientY
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY })
    setConnectMenu({
      screenX: clientX,
      screenY: clientY,
      flowX: flowPos.x,
      flowY: flowPos.y,
      fromNodeId: connectionState.fromNode.id,
      fromHandleId: connectionState.fromHandle?.id ?? null,
    })
  }, [screenToFlowPosition])

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
      else if (preset.type === 'personne') nodeType = 'personne'
      else if (preset.type === 'detective') nodeType = 'detective'

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
          ...(preset.subtype ? { subtype: preset.subtype } : {}),
          ...(preset.score !== undefined ? { score: preset.score } : {}),
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

  const doClear = useCallback(() => {
    setNodes([])
    setEdges([])
    nodeIdCounter = 0
    localStorage.removeItem(AUTOSAVE_KEY)
  }, [setNodes, setEdges])

  const onClear = useCallback(() => {
    setIsNewProject(true)
    setShowWelcome(true)
  }, [])

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, _node: Node) => {
    // Editing is handled inside the CustomNode component
  }, [])

  // Bring clicked node to the front so it renders above overlapping siblings
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEdgeContextMenu(null)
    setNodes((nds) => {
      const idx = nds.findIndex((n) => n.id === node.id)
      if (idx === -1 || idx === nds.length - 1) return nds
      return [...nds.slice(0, idx), ...nds.slice(idx + 1), nds[idx]]
    })
  }, [setNodes, setEdgeContextMenu])

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
      setEdgeContextMenu({ x: event.clientX, y: event.clientY, edge })
    },
    []
  )

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setNodeContextMenu({ x: event.clientX, y: event.clientY, node })
  }, [])

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
    const idMap: Record<string, string> = {}

    // Center the pasted group around the last click position
    const xs = clipboardRef.current.map((n) => n.position.x)
    const ys = clipboardRef.current.map((n) => n.position.y)
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
    const dx = lastClickPosRef.current.x - centerX
    const dy = lastClickPosRef.current.y - centerY

    const newNodes = clipboardRef.current.map((n) => {
      const newId = getNextNodeId()
      idMap[n.id] = newId
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + dx, y: n.position.y + dy },
        selected: true,
        data: { ...n.data },
      }
    })

    const newEdges: Edge[] = clipboardEdgesRef.current
      .filter((e) => idMap[e.source] && idMap[e.target])
      .map((e) => ({
        ...e,
        id: `e-${idMap[e.source]}-${idMap[e.target]}-${Date.now()}`,
        source: idMap[e.source],
        target: idMap[e.target],
        data: { ...e.data },
      }))

    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNodes))
    if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
  }, [setNodes, setEdges])

  const onExportPNG = useCallback(() => {
    exportToPNG('organisation', nodes)
  }, [nodes])

  const onExportPDF = useCallback(() => {
    exportToPDF('organisation', nodes)
  }, [nodes])

  const onOllamaGenerate = useCallback(async (style: OllamaStyle, options?: GenerateOptions) => {
    setOllamaLoading(true)
    setOllamaResult('')
    setOllamaError(null)

    const filteredNodes = options?.categoryFilter
      ? nodes.filter((n) => (n.data as any).category === options.categoryFilter)
      : nodes

    const result = await generateFromNodes(filteredNodes, (token) => {
      setOllamaResult((prev) => prev + token)
    }, style, edges, options?.instructions || '')

    if (result.error) {
      setOllamaError(result.error)
    }
    setOllamaLoading(false)
  }, [nodes, edges])

  const onSendToEditor = useCallback((text: string) => {
    setRawMarkdown(text)
    const html = String(marked.parse(text, { async: false, breaks: true, gfm: true }))
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

    const selectedNode = nodes.find((n) => n.selected)
    const baseX = selectedNode ? selectedNode.position.x + 200 : lastClickPosRef.current.x
    const baseY = selectedNode ? selectedNode.position.y + 100 : lastClickPosRef.current.y
    const pos = findFreePosition(baseX, baseY, nodes)

    const newId = getNextNodeId()
    const newNode: Node = {
      id: newId,
      type: 'custom',
      position: pos,
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

  const onAddNodeFromSearch = useCallback((preset: import('./data/presets').PresetNode) => {
    const newId = getNextNodeId()
    const nodeType =
      preset.type === 'sticky' ? 'sticky' :
      preset.type === 'router' ? 'router' :
      preset.type === 'vignette' ? 'vignette' :
      preset.type === 'personne' ? 'personne' :
      preset.type === 'detective' ? 'detective' : 'custom'
    const base = lastClickPosRef.current
    const pos = findFreePosition(base.x, base.y, nodes)
    history.push(nodes, edges)
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: nodeType,
        position: pos,
        data: {
          label: preset.label,
          description: preset.description,
          color: preset.color,
          category: preset.category,
          ...(preset.subtype ? { subtype: preset.subtype } : {}),
          ...(preset.score !== undefined ? { score: preset.score } : {}),
        },
      },
    ])
  }, [nodes, edges, history, setNodes])

  const onApplyTemplate = useCallback((templateNodes: Node[], templateEdges: Edge[]) => {
    history.push(nodes, edges)
    setNodes(templateNodes)
    setEdges(templateEdges)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [nodes, edges, history, setNodes, setEdges, fitView])

  const onImportFromPdf = useCallback((importedNodes: Node[], importedEdges: Edge[]) => {
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(importedNodes, importedEdges, 'TB')
    history.push(nodes, edges)
    setNodes(layouted)
    setEdges(layoutedEdges)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [nodes, edges, history, setNodes, setEdges, fitView])

  const onDuplicate = useCallback(() => {
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0) return
    const xs = selected.map((n) => n.position.x)
    const ys = selected.map((n) => n.position.y)
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
    const dx = lastClickPosRef.current.x - centerX
    const dy = lastClickPosRef.current.y - centerY
    const newNodes = selected.map((n) => ({
      ...n,
      id: getNextNodeId(),
      position: { x: n.position.x + dx, y: n.position.y + dy },
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

  // Native Mac menu actions
  useEffect(() => {
    window.electronAPI?.onMenuAction?.((action) => {
      switch (action) {
        case 'save': onSave(); break
        case 'load': onLoad(); break
        case 'new': onClear(); break
        case 'exportpng': onExportPNG(); break
        case 'exportpdf': onExportPDF(); break
        case 'undo': onUndo(); break
        case 'redo': onRedo(); break
        case 'copy': onCopy(); break
        case 'paste': onPaste(); break
        case 'duplicate': onDuplicate(); break
        case 'selectall': onSelectAll(); break
        case 'layout': onAutoLayout(); break
        case 'direction': onToggleDirection(); break
        case 'fitview': fitView({ padding: 0.2 }); break
        case 'minimap': setShowMinimap((v) => !v); break
        case 'theme': setTheme((t) => t === 'dark' ? 'light' : 'dark'); break
        case 'ollama': setShowOllama((v) => !v); break
        case 'editor': setShowEditor((v) => !v); break
        case 'templates': setShowTemplates((v) => !v); break
        case 'categories': setShowCustomCategories((v) => !v); break
        case 'shortcuts': setShowShortcuts((v) => !v); break
        case 'help': setShowHelp((v) => !v); break
        case 'welcome': localStorage.removeItem(SKIP_KEY); setShowWelcome(true); break
        case 'addunderlay': {
          const id = getNextNodeId()
          history.push(nodes, edges)
          const pos = lastClickPosRef.current
          setNodes((nds) => [...nds, { id, type: 'underlay', position: { x: pos.x - 150, y: pos.y - 100 }, style: { width: 300, height: 200, zIndex: -1 }, data: { label: 'Zone', color: '#6366f1' } }])
          break
        }
      }
    })
  }, [onSave, onLoad, onClear, onExportPNG, onExportPDF, onUndo, onRedo, onCopy, onPaste, onDuplicate, onSelectAll, onAutoLayout, onToggleDirection, fitView, nodes, edges, history, setNodes])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault()
          e.stopImmediatePropagation()
          switch (shortcut.id) {
            // Fichier
            case 'save': onSave(); break
            case 'load': onLoad(); break
            case 'new': onClear(); break
            // Édition
            case 'undo': onUndo(); break
            case 'redo': onRedo(); break
            case 'selectall': onSelectAll(); break
            case 'copy': onCopy(); break
            case 'paste': onPaste(); break
            case 'duplicate': onDuplicate(); break
            case 'disconnect': onDisconnectSelected(); break
            // Vue & Layout
            case 'layout': onAutoLayout(); break
            case 'direction': onToggleDirection(); break
            case 'fitview': fitView({ padding: 0.2 }); break
            case 'minimap': setShowMinimap((v) => !v); break
            case 'addunderlay': {
              const id = getNextNodeId()
              history.push(nodes, edges)
              const pos = lastClickPosRef.current
              setNodes((nds) => [...nds, {
                id, type: 'underlay',
                position: { x: pos.x - 150, y: pos.y - 100 },
                style: { width: 300, height: 200, zIndex: -1 },
                data: { label: 'Zone', color: '#6366f1' },
              }])
              break
            }
            // Panneaux
            case 'ollama': setShowOllama((v) => !v); break
            case 'editor': setShowEditor((v) => !v); break
            case 'quicksearch': setShowQuickSearch((v) => !v); break
            case 'templates': setShowTemplates((v) => !v); break
            case 'categories': setShowCustomCategories((v) => !v); break
            case 'shortcuts': setShowShortcuts((v) => !v); break
            case 'help': setShowHelp((v) => !v); break
            // Export
            case 'exportpng': onExportPNG(); break
            case 'exportpdf': onExportPDF(); break
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
          const pos = lastClickPosRef.current
          history.push(nodes, edges)
          setNodes((nds) => [
            ...nds,
            {
              id: newId,
              type: nodeType,
              position: { x: pos.x + Math.random() * 20 - 10, y: pos.y + Math.random() * 20 - 10 },
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
  }, [shortcuts, nodeShortcuts, onSave, onLoad, onClear, onAutoLayout, onToggleDirection, fitView, onUndo, onRedo, onSelectAll, onCopy, onPaste, onDuplicate, onExportPNG, onExportPDF, onDisconnectSelected, nodes, edges, history, setNodes, setShowMinimap, setShowOllama, setShowEditor, setShowQuickSearch, setShowTemplates, setShowCustomCategories, setShowShortcuts, setShowHelp])

  const onNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type !== 'underlay') return
    const uw = node.measured?.width ?? 300
    const uh = node.measured?.height ?? 200
    const contained = nodes.filter((n) => {
      if (n.id === node.id || n.type === 'underlay') return false
      const nw = n.measured?.width ?? 180
      const nh = n.measured?.height ?? 80
      const cx = n.position.x + nw / 2
      const cy = n.position.y + nh / 2
      return cx >= node.position.x && cx <= node.position.x + uw && cy >= node.position.y && cy <= node.position.y + uh
    })
    const containedStartPositions: Record<string, { x: number; y: number }> = {}
    contained.forEach((n) => { containedStartPositions[n.id] = { ...n.position } })
    underlayDragRef.current = {
      underlayId: node.id,
      startPos: { ...node.position },
      containedIds: contained.map((n) => n.id),
      containedStartPositions,
    }
  }, [nodes])

  const onNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
    const ref = underlayDragRef.current
    if (!ref || node.id !== ref.underlayId) return
    const dx = node.position.x - ref.startPos.x
    const dy = node.position.y - ref.startPos.y
    setNodes((nds) =>
      nds.map((n) => {
        if (!ref.containedIds.includes(n.id)) return n
        const start = ref.containedStartPositions[n.id]
        return { ...n, position: { x: start.x + dx, y: start.y + dy } }
      })
    )
  }, [setNodes])

  const onNodeDragStop = useCallback(() => {
    underlayDragRef.current = null
  }, [])

  return (
    <div className="app-container">
      {showWelcome && (
        <WelcomeScreen
          hasAutosave={!isNewProject && !!loadAutoSave()}
          lastTaskMode={activeTaskMode}
          isNewProject={isNewProject}
          onContinue={() => {
            setShowWelcome(false)
            setIsNewProject(false)
          }}
          onManageCategories={() => {
            setShowWelcome(false)
            setIsNewProject(false)
            setShowCustomCategories(true)
          }}
          onEnterApp={(taskMode?: TaskMode) => {
            if (isNewProject) doClear()
            setShowWelcome(false)
            setIsNewProject(false)
            const mode = taskMode ?? null
            setActiveTaskMode(mode)
            if (mode) localStorage.setItem('nodeorg-last-task-mode', mode.id)
            else localStorage.removeItem('nodeorg-last-task-mode')
          }}
        />
      )}
      {showSetupWizard && (
        <SetupWizard
          onComplete={(model) => {
            localStorage.setItem('nodeorg-setup-done', '1')
            localStorage.setItem('nodeorg-ollama-model', model)
            setShowSetupWizard(false)
          }}
          onSkip={() => {
            localStorage.setItem('nodeorg-setup-done', '1')
            setShowSetupWizard(false)
          }}
        />
      )}
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
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((v) => !v)}
        onAddUnderlay={() => {
          const id = getNextNodeId()
          history.push(nodes, edges)
          const pos = lastClickPosRef.current
          setNodes((nds) => [...nds, {
            id, type: 'underlay',
            position: { x: pos.x - 150, y: pos.y - 100 },
            style: { width: 300, height: 200, zIndex: -1 },
            data: { label: 'Zone', color: '#6366f1' },
          }])
        }}
        onShowHelp={() => setShowHelp(true)}
        activeSuperCatIds={activeTaskMode && activeTaskMode.id !== 'all' ? activeTaskMode.superCatIds : null}
        onShowWelcome={() => { localStorage.removeItem(SKIP_KEY); setShowWelcome(true) }}
        onManageCategories={() => setShowCustomCategories(true)}
        onOpenTemplates={() => setShowTemplates(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        isNetworkActive={isNetworkActive}
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showCustomCategories && (
        <CustomCategoriesModal onClose={() => setShowCustomCategories(false)} />
      )}

      {/* Node context menu */}
      {nodeContextMenu && (
        <div
          className="node-context-menu"
          style={{ top: nodeContextMenu.y, left: nodeContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="node-context-item"
            onClick={() => {
              setSaveToCategoryPicker(nodeContextMenu.node)
              setNodeContextMenu(null)
            }}
          >
            📌 Sauvegarder dans mes catégories
          </button>
          <div className="node-context-divider" />
          <button
            className="node-context-item node-context-danger"
            onClick={() => {
              setNodes((nds) => nds.filter((n) => n.id !== nodeContextMenu.node.id))
              setNodeContextMenu(null)
            }}
          >
            🗑 Supprimer ce node
          </button>
        </div>
      )}

      {/* Blender-style connect menu */}
      {connectMenu && (
        <div
          className="connect-menu"
          style={{ top: connectMenu.screenY, left: connectMenu.screenX }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="connect-menu-title">Créer et connecter</div>

          <div className="connect-menu-connectors">
            {[{ key: '', label: '→' }, ...Object.entries(LINK_TYPES).map(([k, lt]) => ({ key: k, label: lt.label }))].map(({ key, label }) => (
              <button
                key={key || 'none'}
                className="connect-connector-btn"
                title={label}
                data-active={key === '' ? 'true' : 'false'}
                onClick={(e) => {
                  const btns = (e.currentTarget.parentElement as HTMLElement).querySelectorAll('.connect-connector-btn')
                  btns.forEach((b) => b.setAttribute('data-active', 'false'))
                  e.currentTarget.setAttribute('data-active', 'true')
                  ;(e.currentTarget.parentElement as HTMLElement).dataset.connector = key
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="connect-menu-section">Nouveau node</div>
          {[
            { type: 'custom',    label: '⬡ Node',        color: '#6366f1' },
            { type: 'sticky',    label: '📝 Sticky',     color: '#fde047' },
            { type: 'personne',  label: '👤 Personne',   color: '#7c3aed' },
            { type: 'detective', label: '🔍 Enquête',    color: '#ef4444' },
            { type: 'vignette',  label: '🖼️ Vignette',  color: '#94a3b8' },
          ].map(({ type, label, color }) => (
            <button
              key={type}
              className="connect-menu-item"
              style={{ borderLeft: `3px solid ${color}` }}
              onClick={() => {
                const connectorKey = (document.querySelector('.connect-menu-connectors') as HTMLElement)?.dataset.connector ?? ''
                const lt = connectorKey ? LINK_TYPES[connectorKey] : null
                const newId = getNextNodeId()
                const newNode: Node = {
                  id: newId,
                  type,
                  position: { x: connectMenu.flowX - 90, y: connectMenu.flowY - 30 },
                  data: { label: label.replace(/^[^\s]+\s/, ''), description: '', color, category: 'custom' },
                }
                const newEdge: Edge = {
                  id: `e-${connectMenu.fromNodeId}-${newId}`,
                  source: connectMenu.fromNodeId,
                  target: newId,
                  type: 'custom',
                  animated: connectorKey !== 'non_etabli',
                  data: { label: lt ? lt.label : '', linkType: connectorKey || null },
                  style: { stroke: lt ? lt.color : color, strokeWidth: 2 },
                }
                history.push(nodes, edges)
                setNodes((nds) => [...nds, newNode])
                setEdges((eds) => [...eds, newEdge])
                setConnectMenu(null)
              }}
            >
              {label}
            </button>
          ))}

          <div className="connect-menu-divider" />
          <button className="connect-menu-cancel" onClick={() => setConnectMenu(null)}>Annuler</button>
        </div>
      )}

      {/* Edge context menu */}
      {edgeContextMenu && (
        <div
          className="node-context-menu"
          style={{ top: edgeContextMenu.y, left: edgeContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="edge-menu-title">Connecteur</div>
          {Object.entries(LINK_TYPES).map(([key, lt]) => {
            const isActive = (edgeContextMenu.edge.data as any)?.linkType === key
            return (
              <button
                key={key}
                className={`node-context-item edge-type-item${isActive ? ' edge-type-active' : ''}`}
                style={{ borderLeft: `3px solid ${lt.color}` }}
                onClick={() => {
                  setEdges((eds) => eds.map((e) =>
                    e.id === edgeContextMenu.edge.id
                      ? { ...e, data: { ...e.data, linkType: isActive ? null : key, label: isActive ? '' : lt.label }, animated: key !== 'non_etabli' }
                      : e
                  ))
                  setEdgeContextMenu(null)
                }}
              >
                <span style={{ color: lt.color }}>●</span> {lt.label}
                {isActive && <span className="edge-type-check">✓</span>}
              </button>
            )
          })}
          <div className="node-context-divider" />
          <button
            className="node-context-item"
            onClick={() => {
              setEdges((eds) => eds.map((e) =>
                e.id === edgeContextMenu.edge.id ? { ...e, data: { ...e.data, linkType: null, label: '' } } : e
              ))
              setEdgeContextMenu(null)
            }}
          >
            ✕ Effacer le connecteur
          </button>
          <div className="node-context-divider" />
          <button
            className="node-context-item node-context-danger"
            onClick={() => {
              setEdges((eds) => eds.filter((e) => e.id !== edgeContextMenu.edge.id))
              setEdgeContextMenu(null)
            }}
          >
            🗑 Supprimer ce lien
          </button>
        </div>
      )}

      {/* Save to category picker */}
      {saveToCategoryPicker && (() => {
        const cats = loadCustomCategories()
        const nodeData = saveToCategoryPicker.data as any
        return (
          <div className="modal-overlay" onClick={() => setSaveToCategoryPicker(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
              <div className="modal-header">
                <h2>📌 Sauvegarder dans une catégorie</h2>
                <button className="modal-close" onClick={() => setSaveToCategoryPicker(null)}>&times;</button>
              </div>
              <div style={{ padding: '16px' }}>
                {cats.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                    Aucune catégorie personnalisée.<br />
                    Crée-en une via "🗂️ Mes catégories".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cats.map((cat) => (
                      <button
                        key={cat.id}
                        className="node-context-item"
                        style={{ borderLeft: `3px solid ${cat.color}`, padding: '10px 14px', borderRadius: 6, background: 'var(--bg-primary)', border: `1px solid var(--border-color)`, borderLeftColor: cat.color }}
                        onClick={() => {
                          const updated = cats.map((c) =>
                            c.id === cat.id
                              ? { ...c, nodes: [...c.nodes, { type: 'custom', label: nodeData.label || 'Node', description: nodeData.description || '', category: cat.id, color: nodeData.color || cat.color }] }
                              : c
                          )
                          saveCustomCategories(updated)
                          setSaveToCategoryPicker(null)
                        }}
                      >
                        <span style={{ marginRight: 8 }}>{cat.icon}</span>
                        <strong>{cat.name}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>{cat.nodes.length} nodes</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

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
          nodes={nodes}
          onClose={() => setShowOllama(false)}
          onGenerate={onOllamaGenerate}
          onSendToEditor={onSendToEditor}
          onAskQuestion={onAskQuestion}
          questionLoading={questionLoading}
          onDownloadStateChange={setIsNetworkActive}
          onImportFromPdf={onImportFromPdf}
        />
      )}

      {showEditor && (
        <TextEditorPanel
          onClose={() => setShowEditor(false)}
          initialContent={editorContent}
          rawMarkdown={rawMarkdown}
          onContentChange={setEditorContent}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onApply={onApplyTemplate}
        />
      )}

      {showQuickSearch && (
        <QuickSearchModal
          onClose={() => setShowQuickSearch(false)}
          onAddNode={onAddNodeFromSearch}
        />
      )}

      <LayoutContext.Provider value={layoutDirection}>
      <div className="canvas-container" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onNodesDelete={onNodesDelete}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          className="react-flow-canvas"
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="bottom-right" className="flow-controls">
            <ControlButton
              onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </ControlButton>
          </Controls>
          {showMinimap && (
            <MiniMap
              position="bottom-left"
              className="flow-minimap"
              nodeColor={(node: Node) => {
                const data = node.data as any
                return data?.color || '#64748b'
              }}
              maskColor={theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.2)'}
            />
          )}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={theme === 'light' ? '#cbd5e1' : '#334155'}
          />
          <Panel position="top-right" className="panel-info">
            <div className="info-badge">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} connexion{edges.length !== 1 ? 's' : ''}
            </div>
          </Panel>
        </ReactFlow>
      </div>
      </LayoutContext.Provider>
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
