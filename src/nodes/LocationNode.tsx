import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface LocationData { name: string; interior: boolean; dayTime: boolean; notes: string; }

export default function LocationNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { name = '', interior = true, dayTime = true, notes = '' } = data as unknown as LocationData;

  const update = useCallback(
    (field: string, value: unknown) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  return (
    <div className="prod-node location-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">📍</div>
      <div className="prod-label-area">
        <span className="prod-title-input" style={{ display: 'block' }}>Lieu de tournage</span>
      </div>

      <input
        className="prod-input nodrag"
        placeholder="Nom du lieu..."
        value={name}
        onChange={(e) => update('name', e.target.value)}
      />

      <div className="toggle-row nodrag">
        <button className={`toggle-btn${interior ? ' active' : ''}`}  onClick={() => update('interior', true)}>  🏠 INT</button>
        <button className={`toggle-btn${!interior ? ' active' : ''}`} onClick={() => update('interior', false)}>🌳 EXT</button>
        <button className={`toggle-btn${dayTime ? ' active' : ''}`}   onClick={() => update('dayTime', true)}>  ☀️ JOUR</button>
        <button className={`toggle-btn${!dayTime ? ' active' : ''}`}  onClick={() => update('dayTime', false)}>🌙 NUIT</button>
      </div>

      <textarea className="prod-textarea nodrag" placeholder="Adresse, accès, contraintes..." value={notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
    </div>
  );
}
