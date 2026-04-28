import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface ActorData { name: string; character: string; notes: string; }

export default function ActorNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { name = '', character = '', notes = '' } = data as unknown as ActorData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  return (
    <div className="prod-node actor-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">🎭</div>
      <div className="prod-label-area">
        <span className="prod-title-input" style={{ display: 'block' }}>Acteur / Comédien</span>
      </div>

      <input className="prod-input nodrag" placeholder="Nom de l'acteur..."    value={name}      onChange={(e) => update('name', e.target.value)}      />
      <input className="prod-input nodrag" placeholder="Personnage incarné..." value={character}  onChange={(e) => update('character', e.target.value)}  />
      <textarea className="prod-textarea nodrag" placeholder="Notes de jeu, costume, maquillage..." value={notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
    </div>
  );
}
