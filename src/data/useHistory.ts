import { useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

const MAX_HISTORY = 50

export function useHistory() {
  const past = useRef<HistoryState[]>([])
  const future = useRef<HistoryState[]>([])

  const push = useCallback((nodes: Node[], edges: Edge[]) => {
    past.current.push({
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
      edges: edges.map((e) => ({ ...e })),
    })
    if (past.current.length > MAX_HISTORY) {
      past.current.shift()
    }
    // Clear future on new action
    future.current = []
  }, [])

  const undo = useCallback(
    (
      currentNodes: Node[],
      currentEdges: Edge[],
      setNodes: (nodes: Node[]) => void,
      setEdges: (edges: Edge[]) => void
    ) => {
      if (past.current.length === 0) return

      // Save current state to future
      future.current.push({
        nodes: currentNodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: currentEdges.map((e) => ({ ...e })),
      })

      const prev = past.current.pop()!
      setNodes(prev.nodes)
      setEdges(prev.edges)
    },
    []
  )

  const redo = useCallback(
    (
      currentNodes: Node[],
      currentEdges: Edge[],
      setNodes: (nodes: Node[]) => void,
      setEdges: (edges: Edge[]) => void
    ) => {
      if (future.current.length === 0) return

      // Save current state to past
      past.current.push({
        nodes: currentNodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: currentEdges.map((e) => ({ ...e })),
      })

      const next = future.current.pop()!
      setNodes(next.nodes)
      setEdges(next.edges)
    },
    []
  )

  const canUndo = useCallback(() => past.current.length > 0, [])
  const canRedo = useCallback(() => future.current.length > 0, [])

  return { push, undo, redo, canUndo, canRedo }
}
