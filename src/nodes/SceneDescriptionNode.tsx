import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const SHOT_TYPES = ['PL', 'PM', 'PA', 'PP', 'GP', 'TGP', 'Anat.', 'Plong.', 'C-P', 'Trav.', 'POV'];

interface SceneDescData {
  seqNumber: number;
  title: string;
  description: string;
  duration: string;
  shotType: string;
}

export default function SceneDescriptionNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { seqNumber, title = '', description = '', duration = '', shotType = 'PM' } = data as unknown as SceneDescData;

  const update = useCallback(
    (field: string, value: string) =>
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n)),
      ),
    [id, setNodes],
  );

  return (
    <div className="scene-node scene-desc-node">
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="node-header desc-header">
        <span className="seq-badge seq-badge-purple">S{seqNumber}</span>
        <span className="node-title">Description</span>
        <span className="node-type-icon">📝</span>
      </div>

      <div className="node-body nodrag">
        <input
          className="node-input"
          placeholder="Titre de la scène..."
          value={title}
          onChange={(e) => update('title', e.target.value)}
        />

        <div className="shot-type-row">
          <span className="field-label">Type de plan</span>
          <div className="shot-chips">
            {SHOT_TYPES.map((t) => (
              <button
                key={t}
                className={`shot-chip${shotType === t ? ' active' : ''}`}
                onClick={() => update('shotType', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="node-textarea"
          placeholder="Description de la scène, action, émotion..."
          value={description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
        />

        <div className="duration-row">
          <span className="field-label">⏱ Durée</span>
          <input
            className="node-input-sm"
            placeholder="ex: 00:30"
            value={duration}
            onChange={(e) => update('duration', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
