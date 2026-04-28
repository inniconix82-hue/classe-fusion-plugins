import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const LIGHT_TYPES = [
  { value: 'key',       label: 'Lumière Principale',   icon: '☀️' },
  { value: 'fill',      label: 'Lumière Remplissage',  icon: '🌤' },
  { value: 'back',      label: 'Contre-Jour',          icon: '🌅' },
  { value: 'ambient',   label: 'Lumière Ambiante',     icon: '💧' },
  { value: 'spot',      label: 'Projecteur',           icon: '🔦' },
  { value: 'practical', label: 'Lumière Pratique',     icon: '💡' },
  { value: 'neon',      label: 'Néon / LED',           icon: '🌈' },
  { value: 'natural',   label: 'Lumière Naturelle',    icon: '🌿' },
  { value: 'candle',    label: 'Bougie / Flamme',      icon: '🕯️' },
];

interface LightData { type: string; label: string; color: string; intensity: string; notes: string; }

export default function LightingNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { type = 'key', label = 'Lumière', color = '#fffbe6', intensity = '80', notes = '' } = data as unknown as LightData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  const current = LIGHT_TYPES.find((l) => l.value === type) ?? LIGHT_TYPES[0];

  return (
    <div className="prod-node lighting-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">💡</div>
      <div className="prod-label-area">
        <input className="prod-title-input nodrag" value={label} onChange={(e) => update('label', e.target.value)} />
      </div>

      <div className="prod-info-badge">
        <span className="prod-badge-icon">{current.icon}</span>
        <span className="prod-badge-label">{current.label}</span>
      </div>

      <select className="prod-select nodrag" value={type} onChange={(e) => update('type', e.target.value)}>
        {LIGHT_TYPES.map((l) => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
      </select>

      <div className="light-controls nodrag">
        <span className="field-label">Couleur</span>
        <input type="color" value={color} onChange={(e) => update('color', e.target.value)} className="color-picker" style={{ background: color }} />
        <span className="field-label">Intensité</span>
        <input type="range" min="0" max="100" value={intensity} onChange={(e) => update('intensity', e.target.value)} className="intensity-slider" />
        <span className="intensity-val">{intensity}%</span>
      </div>

      <textarea className="prod-textarea nodrag" placeholder="Notes lumière..." value={notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
    </div>
  );
}
