import { useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles/storyboard.css';

import SceneImageNode from './nodes/SceneImageNode';
import SceneDescriptionNode from './nodes/SceneDescriptionNode';
import EquipmentNode from './nodes/EquipmentNode';
import CameraNode from './nodes/CameraNode';
import LightingNode from './nodes/LightingNode';
import SoundNode from './nodes/SoundNode';
import LocationNode from './nodes/LocationNode';
import ActorNode from './nodes/ActorNode';
import DirectorNoteNode from './nodes/DirectorNoteNode';

const nodeTypes = {
  sceneImage: SceneImageNode,
  sceneDescription: SceneDescriptionNode,
  equipment: EquipmentNode,
  camera: CameraNode,
  lighting: LightingNode,
  sound: SoundNode,
  location: LocationNode,
  actor: ActorNode,
  directorNote: DirectorNoteNode,
};

const SEQ_STEP_X = 420;
const IMAGE_NODE_H = 262;
const DESC_NODE_H = 234;
const GAP_Y = 16;
const START_X = 60;
const START_Y = 60;

const internalEdgeStyle = { stroke: '#4f46e5', strokeWidth: 2 };
const seqLinkStyle = { stroke: '#f59e0b', strokeWidth: 3 };

function createSequence(seqNum: number): { nodes: Node[]; edges: Edge[] } {
  const x = START_X + (seqNum - 1) * SEQ_STEP_X;
  const imgY = START_Y;
  const descY = imgY + IMAGE_NODE_H + GAP_Y;
  const equipY = descY + DESC_NODE_H + GAP_Y;
  const imgId = `seq${seqNum}-image`;
  const descId = `seq${seqNum}-desc`;
  const equipId = `seq${seqNum}-equip`;
  return {
    nodes: [
      { id: imgId, type: 'sceneImage', position: { x, y: imgY }, data: { seqNumber: seqNum, image: null } },
      { id: descId, type: 'sceneDescription', position: { x, y: descY }, data: { seqNumber: seqNum, title: `Scène ${seqNum}`, description: '', duration: '', shotType: 'PM' } },
      { id: equipId, type: 'equipment', position: { x, y: equipY }, data: { seqNumber: seqNum, items: [] } },
    ],
    edges: [
      { id: `e-${imgId}-${descId}`, source: imgId, target: descId, sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: internalEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } },
      { id: `e-${descId}-${equipId}`, source: descId, target: equipId, sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: internalEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } },
    ],
  };
}

function createSeqLink(from: number, to: number): Edge {
  return {
    id: `e-seq${from}-seq${to}`,
    source: `seq${from}-image`,
    target: `seq${to}-image`,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    style: seqLinkStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
  };
}

const { nodes: s1n, edges: s1e } = createSequence(1);
const { nodes: s2n, edges: s2e } = createSequence(2);
const initialNodes: Node[] = [...s1n, ...s2n];
const initialEdges: Edge[] = [...s1e, ...s2e, createSeqLink(1, 2)];

const PROD_NODES = [
  { type: 'camera', icon: '📷', title: 'Caméra' },
  { type: 'lighting', icon: '💡', title: 'Lumière' },
  { type: 'sound', icon: '🎤', title: 'Son' },
  { type: 'location', icon: '📍', title: 'Lieu de tournage' },
  { type: 'actor', icon: '🎭', title: 'Acteur / Comédien' },
  { type: 'directorNote', icon: '📋', title: 'Note réalisateur' },
];

const PROD_DEFAULTS: Record<string, object> = {
  camera: { angle: 'medium', label: 'Caméra', notes: '' },
  lighting: { type: 'key', label: 'Lumière', color: '#ffffff', intensity: '80', notes: '' },
  sound: { type: 'dialogue', label: 'Son', notes: '' },
  location: { name: '', interior: true, dayTime: true, notes: '' },
  actor: { name: '', character: '', notes: '' },
  directorNote: { note: '', priority: 'normal' },
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [seqCount, setSeqCount] = useState(2);
  const [extraCount, setExtraCount] = useState(0);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds)),
    [setEdges],
  );

  const addSequence = useCallback(() => {
    const next = seqCount + 1;
    const { nodes: nn, edges: ne } = createSequence(next);
    setNodes((nds) => [...nds, ...nn]);
    setEdges((eds) => [...eds, ...ne, createSeqLink(seqCount, next)]);
    setSeqCount(next);
  }, [seqCount, setNodes, setEdges]);

  const addProdNode = useCallback(
    (type: string) => {
      const n = extraCount + 1;
      setExtraCount(n);
      setNodes((nds) => [
        ...nds,
        {
          id: `${type}-${n}`,
          type,
          position: { x: START_X + ((n - 1) % 6) * 250, y: -240 },
          data: PROD_DEFAULTS[type] ?? {},
        },
      ]);
    },
    [extraCount, setNodes],
  );

  return (
    <div className="storyboard-app">
      <header className="app-header">
        <span className="app-logo">🎬</span>
        <h1 className="app-title">StoryBoard Pro</h1>
        <span className="app-subtitle">Application de pré-production cinéma</span>
      </header>

      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2.5}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1a1a30" />
          <Controls className="rf-controls" />
          <MiniMap
            nodeColor={(n) =>
              ({ sceneImage: '#4f46e5', sceneDescription: '#7c3aed', equipment: '#059669', camera: '#dc2626', lighting: '#d97706', sound: '#0891b2', location: '#16a34a', actor: '#9333ea', directorNote: '#ea580c' }[n.type ?? ''] ?? '#6b7280')
            }
            maskColor="rgba(0,0,0,0.65)"
            className="rf-minimap"
          />

          <Panel position="top-left" className="toolbar-panel">
            <button className="btn btn-sequence" onClick={addSequence}>
              ＋ Séquence
            </button>
            <div className="toolbar-sep" />
            <span className="toolbar-label">Ajouter :</span>
            {PROD_NODES.map(({ type, icon, title }) => (
              <button
                key={type}
                className={`btn btn-icon btn-${type}`}
                onClick={() => addProdNode(type)}
                title={title}
              >
                {icon}
              </button>
            ))}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
