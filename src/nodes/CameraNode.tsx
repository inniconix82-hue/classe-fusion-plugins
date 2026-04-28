import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const ANGLES = [
  { value: 'wide',        label: 'Plan Large',       icon: '🔭' },
  { value: 'medium',      label: 'Plan Moyen',        icon: '📷' },
  { value: 'american',    label: 'Plan Américain',    icon: '🤠' },
  { value: 'close',       label: 'Gros Plan',         icon: '🔍' },
  { value: 'extreme',     label: 'Très Gros Plan',    icon: '👁' },
  { value: 'aerial',      label: 'Vue Aérienne',      icon: '👆' },
  { value: 'high-angle',  label: 'Plongée',           icon: '⬇️' },
  { value: 'low-angle',   label: 'Contre-Plongée',    icon: '⬆️' },
  { value: 'tracking',    label: 'Travelling',        icon: '🚂' },
  { value: 'pov',         label: 'Point de Vue',      icon: '👀' },
  { value: 'over',        label: 'Over The Shoulder', icon: '🧑' },
  { value: 'dutch',       label: 'Angle Hollandais',  icon: '↕️' },
];

interface CameraData { angle: string; label: string; notes: string; }

export default function CameraNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { angle = 'medium', label = 'Caméra', notes = '' } = data as unknown as CameraData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  const current = ANGLES.find((a) => a.value === angle) ?? ANGLES[1];

  return (
    <div className="prod-node camera-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">📷</div>
      <div className="prod-label-area">
        <input className="prod-title-input nodrag" value={label} onChange={(e) => update('label', e.target.value)} />
      </div>

      <div className="prod-info-badge">
        <span className="prod-badge-icon">{current.icon}</span>
        <span className="prod-badge-label">{current.label}</span>
      </div>

      <select className="prod-select nodrag" value={angle} onChange={(e) => update('angle', e.target.value)}>
        {ANGLES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
      </select>

      <textarea className="prod-textarea nodrag" placeholder="Notes caméra..." value={notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
    </div>
  );
}
