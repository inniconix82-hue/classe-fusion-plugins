import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const SOUND_TYPES = [
  { value: 'dialogue', label: 'Dialogue',        icon: '💬' },
  { value: 'ambient',  label: 'Ambiance',         icon: '🌊' },
  { value: 'music',    label: 'Musique',           icon: '🎵' },
  { value: 'sfx',      label: 'Effets Sonores',   icon: '💥' },
  { value: 'foley',    label: 'Foley',            icon: '👣' },
  { value: 'voice',    label: 'Voix Off',         icon: '🎩' },
  { value: 'silence',  label: 'Silence / Muet',   icon: '🔇' },
];

interface SoundData { type: string; label: string; notes: string; }

export default function SoundNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { type = 'dialogue', label = 'Son', notes = '' } = data as unknown as SoundData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  const current = SOUND_TYPES.find((s) => s.value === type) ?? SOUND_TYPES[0];

  return (
    <div className="prod-node sound-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">🎤</div>
      <div className="prod-label-area">
        <input className="prod-title-input nodrag" value={label} onChange={(e) => update('label', e.target.value)} />
      </div>

      <div className="prod-info-badge">
        <span className="prod-badge-icon">{current.icon}</span>
        <span className="prod-badge-label">{current.label}</span>
      </div>

      <select className="prod-select nodrag" value={type} onChange={(e) => update('type', e.target.value)}>
        {SOUND_TYPES.map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
      </select>

      <textarea className="prod-textarea nodrag" placeholder="Notes son, microphone, ambiance..." value={notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
    </div>
  );
}
