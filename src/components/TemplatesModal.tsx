import React from 'react'
import type { Node, Edge } from '@xyflow/react'

interface TemplatesModalProps {
  onClose: () => void
  onApply: (nodes: Node[], edges: Edge[]) => void
}

type TNode = { label: string; description: string; color: string; x: number; y: number }
type TEdge = { from: number; to: number }
type Template = { id: string; name: string; icon: string; desc: string; nodes: TNode[]; edges: TEdge[] }

const TEMPLATES: Template[] = [
  {
    id: 'reunion', name: 'Réunion', icon: '📋',
    desc: 'Participants · Objectifs · Décisions · Actions · Date',
    nodes: [
      { label: 'Participants', description: '', color: '#3b82f6', x: 50, y: 100 },
      { label: 'Objectifs', description: '', color: '#6366f1', x: 300, y: 100 },
      { label: 'Décisions', description: '', color: '#10b981', x: 550, y: 100 },
      { label: 'Actions', description: '', color: '#f59e0b', x: 800, y: 100 },
      { label: 'Date', description: new Date().toLocaleDateString('fr-FR'), color: '#94a3b8', x: 425, y: 280 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }],
  },
  {
    id: 'cours', name: 'Cours', icon: '🎓',
    desc: 'Titre · Concepts clés · Exemples · Questions · Résumé',
    nodes: [
      { label: 'Titre du cours', description: '', color: '#8b5cf6', x: 350, y: 50 },
      { label: 'Concepts clés', description: '', color: '#3b82f6', x: 50, y: 250 },
      { label: 'Exemples', description: '', color: '#10b981', x: 250, y: 250 },
      { label: 'Questions', description: '', color: '#f59e0b', x: 450, y: 250 },
      { label: 'Résumé', description: '', color: '#8b5cf6', x: 650, y: 250 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }],
  },
  {
    id: 'projet', name: 'Projet', icon: '🚀',
    desc: 'Brief · Objectifs · Contraintes · Livrables · Deadline',
    nodes: [
      { label: 'Brief', description: '', color: '#3b82f6', x: 350, y: 50 },
      { label: 'Objectifs', description: '', color: '#10b981', x: 50, y: 250 },
      { label: 'Contraintes', description: '', color: '#ef4444', x: 250, y: 250 },
      { label: 'Livrables', description: '', color: '#f59e0b', x: 450, y: 250 },
      { label: 'Deadline', description: '', color: '#6366f1', x: 650, y: 250 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }],
  },
  {
    id: 'brainstorm', name: 'Brainstorm', icon: '💡',
    desc: 'Problème · Idées · Critères · Sélection',
    nodes: [
      { label: 'Problème', description: '', color: '#ef4444', x: 300, y: 50 },
      { label: 'Idées', description: '', color: '#f59e0b', x: 100, y: 220 },
      { label: 'Critères', description: '', color: '#6366f1', x: 500, y: 220 },
      { label: 'Sélection', description: '', color: '#10b981', x: 300, y: 390 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 3 }],
  },
  {
    id: 'vierge', name: 'Carte vierge', icon: '✨',
    desc: 'Démarrage libre sans node précréé',
    nodes: [],
    edges: [],
  },
]

let _counter = 0

function buildNodesEdges(template: Template): { nodes: Node[]; edges: Edge[] } {
  const ids = template.nodes.map(() => `tmpl_${++_counter}_${Date.now()}`)

  const nodes: Node[] = template.nodes.map((n, i) => ({
    id: ids[i],
    type: 'custom' as const,
    position: { x: n.x, y: n.y },
    data: { label: n.label, description: n.description, color: n.color, category: '' },
  }))

  const edges: Edge[] = template.edges.map((e) => ({
    id: `te-${ids[e.from]}-${ids[e.to]}-${Date.now()}`,
    source: ids[e.from],
    target: ids[e.to],
    type: 'custom',
    animated: true,
    data: { label: '' },
    style: { stroke: '#64748b', strokeWidth: 2 },
  }))

  return { nodes, edges }
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ onClose, onApply }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🗂️ Templates de démarrage</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="templates-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="template-card"
              onClick={() => {
                const { nodes, edges } = buildNodesEdges(t)
                onApply(nodes, edges)
                onClose()
              }}
            >
              <div className="template-icon">{t.icon}</div>
              <div className="template-name">{t.name}</div>
              <div className="template-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemplatesModal
