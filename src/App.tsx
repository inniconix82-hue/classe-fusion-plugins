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

const internalEdge = { stroke: '#4f46e5', strokeWidth: 2 };
const seqLinkEdge  = { stroke: '#f59e0b', strokeWidth: 3 };

function createSequence(
  seqNum: number,
  descData?: Record<string, unknown>,
  equipItems?: { id: string; label: string; checked: boolean }[],
): { nodes: Node[]; edges: Edge[] } {
  const x = START_X + (seqNum - 1) * SEQ_STEP_X;
  const imgY  = START_Y;
  const descY = imgY  + IMAGE_NODE_H + GAP_Y;
  const equipY = descY + DESC_NODE_H + GAP_Y;
  const imgId  = `seq${seqNum}-image`;
  const descId = `seq${seqNum}-desc`;
  const equipId = `seq${seqNum}-equip`;
  return {
    nodes: [
      { id: imgId,   type: 'sceneImage',       position: { x, y: imgY  }, data: { seqNumber: seqNum, image: null } },
      { id: descId,  type: 'sceneDescription', position: { x, y: descY }, data: { seqNumber: seqNum, title: `Scène ${seqNum}`, description: '', duration: '', shotType: 'PM', ...descData } },
      { id: equipId, type: 'equipment',         position: { x, y: equipY }, data: { seqNumber: seqNum, items: equipItems ?? [] } },
    ],
    edges: [
      { id: `e-${imgId}-${descId}`,   source: imgId,  target: descId,  sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: internalEdge, markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } },
      { id: `e-${descId}-${equipId}`, source: descId, target: equipId, sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: internalEdge, markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } },
    ],
  };
}

function seqLink(from: number, to: number): Edge {
  return {
    id: `e-seq${from}-seq${to}`,
    source: `seq${from}-image`, target: `seq${to}-image`,
    sourceHandle: 'right', targetHandle: 'left',
    type: 'smoothstep', animated: true,
    style: seqLinkEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
  };
}

// ─── Données d'exemple : court-métrage "L’Éclipse" ───────────────────────────
const ex1 = createSequence(
  1,
  { title: 'Arrivée à la gare', description: 'MARC arrive à la gare, valise à la main. Le hall est désert. Il consulte sa montre, l’air inquiet.', duration: '00:45', shotType: 'PL' },
  [
    { id: 'e1', label: 'Caméra Sony FX3', checked: true },
    { id: 'e2', label: 'Objectif 24mm', checked: true },
    { id: 'e3', label: 'Stabilisateur Ronin', checked: false },
    { id: 'e4', label: 'Mallette maquillage', checked: false },
  ],
);

const ex2 = createSequence(
  2,
  { title: 'Le quai désert', description: 'MARC avance sur le quai vide. Ses pas résonnent. Au bout du quai, une silhouette attend.\n\nLa lumière fléchit. L’éclipse commence.', duration: '01:10', shotType: 'PM' },
  [
    { id: 'e5', label: 'Caméra Sony FX3', checked: true },
    { id: 'e6', label: 'Objectif 50mm', checked: true },
    { id: 'e7', label: 'Rail de travelling 3m', checked: false },
    { id: 'e8', label: 'Fumée de scène', checked: false },
    { id: 'e9', label: 'Micro-canon Rode', checked: true },
  ],
);

const ex3 = createSequence(
  3,
  { title: 'La rencontre', description: 'MARC s’arrête face à la silhouette. C’est ELENA. Ils se regardent. Aucun mot n’est nécessaire.\n\nGros plan sur les yeux de MARC.', duration: '00:30', shotType: 'GP' },
  [
    { id: 'ea', label: 'Caméra Sony FX3', checked: true },
    { id: 'eb', label: 'Objectif 85mm f/1.4', checked: true },
    { id: 'ec', label: 'Dif. soft-box', checked: false },
    { id: 'ed', label: 'Reflécteur 5-en-1', checked: false },
  ],
);

// Nodes de production déjà positionnés (zone au-dessus des séquences)
const prodNodes: Node[] = [
  {
    id: 'cam-1', type: 'camera',
    position: { x: 60, y: -250 },
    data: { angle: 'wide', label: 'Caméra A — Plan large', notes: 'Grue 3m — point fixe' },
  },
  {
    id: 'cam-2', type: 'camera',
    position: { x: 310, y: -250 },
    data: { angle: 'tracking', label: 'Caméra B — Travelling', notes: 'Travelling latéral droit→gauche' },
  },
  {
    id: 'cam-3', type: 'camera',
    position: { x: 560, y: -250 },
    data: { angle: 'close', label: 'Caméra C — Gros plan', notes: 'Objectif 85mm f/1.4 — main focus' },
  },
  {
    id: 'light-1', type: 'lighting',
    position: { x: 820, y: -250 },
    data: { type: 'key', label: 'Lumière principale', color: '#ffe8a0', intensity: '75', notes: 'Sofbox 120x80 à gauche cadre' },
  },
  {
    id: 'light-2', type: 'lighting',
    position: { x: 1060, y: -250 },
    data: { type: 'practical', label: 'Ambiance quai', color: '#b8d4ff', intensity: '40', notes: 'Lumières néon du quai — naturelles' },
  },
  {
    id: 'sound-1', type: 'sound',
    position: { x: 1300, y: -250 },
    data: { type: 'ambient', label: 'Son ambiance gare', notes: 'Bruits de gare + annonces lointaines\nMicro-canon directionnel + lav MARC' },
  },
  {
    id: 'loc-1', type: 'location',
    position: { x: 60, y: -470 },
    data: { name: 'Gare de Lyon — Quai 3', interior: true, dayTime: false, notes: 'Autorisation tournage signée\n23h00 — 02h00' },
  },
  {
    id: 'actor-marc', type: 'actor',
    position: { x: 310, y: -470 },
    data: { name: 'Thomas Duval', character: 'MARC', notes: 'Costume : imperméable gris, valise noire\nMaquillage : fatigue marquée' },
  },
  {
    id: 'actor-elena', type: 'actor',
    position: { x: 560, y: -470 },
    data: { name: 'Sophie Martin', character: 'ELENA', notes: 'Costume : robe noire, chapeau sombre\nJeu : immobile, regard intense' },
  },
  {
    id: 'note-1', type: 'directorNote',
    position: { x: 820, y: -470 },
    data: { priority: 'urgent', note: 'Crépuscule lunaire obligatoire en arrière-plan — vérifier météo !\n\nL’éclipse dans le film doit coïncider avec le vrai début de scène 2.' },
  },
  {
    id: 'note-2', type: 'directorNote',
    position: { x: 1060, y: -470 },
    data: { priority: 'high', note: 'Scène 3 : tourner sans dialogues. Tout passe par le regard et la musique (Arvo Pärt — Spiegel im Spiegel).' },
  },
];

// Arêtes reliant les nodes de prod aux scènes
const prodEdges: Edge[] = [
  { id: 'e-cam1-s1', source: 'cam-1', target: 'seq1-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#dc2626', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-cam2-s2', source: 'cam-2', target: 'seq2-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#dc2626', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-cam3-s3', source: 'cam-3', target: 'seq3-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#dc2626', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-l1-s1',   source: 'light-1', target: 'seq1-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#d97706', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-l2-s2',   source: 'light-2', target: 'seq2-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#d97706', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-snd-s2',  source: 'sound-1', target: 'seq2-desc',  sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#0891b2', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-marc-s2', source: 'actor-marc',  target: 'seq2-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#9333ea', strokeWidth: 1.5, strokeDasharray: '5 3' } },
  { id: 'e-elena-s3',source: 'actor-elena', target: 'seq3-image', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#9333ea', strokeWidth: 1.5, strokeDasharray: '5 3' } },
];

const { nodes: s1n, edges: s1e } = ex1;
const { nodes: s2n, edges: s2e } = ex2;
const { nodes: s3n, edges: s3e } = ex3;

const initialNodes: Node[] = [...s1n, ...s2n, ...s3n, ...prodNodes];
const initialEdges: Edge[] = [
  ...s1e, ...s2e, ...s3e,
  seqLink(1, 2), seqLink(2, 3),
  ...prodEdges,
];

const PROD_NODES_CFG = [
  { type: 'camera',       icon: '📷', title: 'Caméra' },
  { type: 'lighting',     icon: '💡', title: 'Lumière' },
  { type: 'sound',        icon: '🎤', title: 'Son' },
  { type: 'location',     icon: '📍', title: 'Lieu de tournage' },
  { type: 'actor',        icon: '🎭', title: 'Acteur / Comédien' },
  { type: 'directorNote', icon: '📋', title: 'Note réalisateur' },
];

const PROD_DEFAULTS: Record<string, object> = {
  camera:       { angle: 'medium', label: 'Caméra', notes: '' },
  lighting:     { type: 'key',     label: 'Lumière', color: '#ffffff', intensity: '80', notes: '' },
  sound:        { type: 'dialogue', label: 'Son', notes: '' },
  location:     { name: '', interior: true, dayTime: true, notes: '' },
  actor:        { name: '', character: '', notes: '' },
  directorNote: { note: '', priority: 'normal' },
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [seqCount,   setSeqCount]   = useState(3);
  const [extraCount, setExtraCount] = useState(prodNodes.length);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds)),
    [setEdges],
  );

  const addSequence = useCallback(() => {
    const next = seqCount + 1;
    const { nodes: nn, edges: ne } = createSequence(next);
    setNodes((nds) => [...nds, ...nn]);
    setEdges((eds) => [...eds, ...ne, seqLink(seqCount, next)]);
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
          position: { x: START_X + ((n - 1) % 6) * 260, y: -250 },
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
        <span className="app-subtitle">L’Éclipse — court-métrage</span>
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
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.08}
          maxZoom={2.5}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1a1a30" />
          <Controls className="rf-controls" />
          <MiniMap
            nodeColor={(n) =>
              ({
                sceneImage: '#4f46e5', sceneDescription: '#7c3aed', equipment: '#059669',
                camera: '#dc2626', lighting: '#d97706', sound: '#0891b2',
                location: '#16a34a', actor: '#9333ea', directorNote: '#ea580c',
              }[n.type ?? ''] ?? '#6b7280')
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
            {PROD_NODES_CFG.map(({ type, icon, title }) => (
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
