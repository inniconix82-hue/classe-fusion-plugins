import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const PRIORITIES = [
  { value: 'low',    emoji: '🟢', label: 'Basse' },
  { value: 'normal', emoji: '🔵', label: 'Normale' },
  { value: 'high',   emoji: '🟠', label: 'Haute' },
  { value: 'urgent', emoji: '🔴', label: 'Urgent' },
];

interface NoteData { note: string; priority: string; }

export default function DirectorNoteNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { note = '', priority = 'normal' } = data as unknown as NoteData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n))),
    [id, setNodes],
  );

  const currentPriority = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];

  return (
    <div className="prod-node director-note-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="prod-icon-area">📋</div>
      <div className="prod-label-area">
        <span className="prod-title-input" style={{ display: 'block' }}>Note Réalisateur</span>
      </div>

      <div className="prod-info-badge">
        <span className="prod-badge-icon">{currentPriority.emoji}</span>
        <span className="prod-badge-label">Priorité {currentPriority.label}</span>
      </div>

      <div className="priority-row nodrag">
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            className={`priority-btn priority-${p.value}${priority === p.value ? ' active' : ''}`}
            title={p.label}
            onClick={() => update('priority', p.value)}
          >
            {p.emoji}
          </button>
        ))}
      </div>

      <textarea
        className="prod-textarea nodrag"
        placeholder="Note du réalisateur, intention artistique..."
        value={note}
        onChange={(e) => update('note', e.target.value)}
        rows={4}
      />
    </div>
  );
}
