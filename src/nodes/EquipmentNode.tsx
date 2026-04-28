import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface EquipItem { id: string; label: string; checked: boolean; }
interface EquipData { seqNumber: number; items: EquipItem[]; }

export default function EquipmentNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { seqNumber, items = [] } = data as unknown as EquipData;

  const updateItems = useCallback(
    (newItems: EquipItem[]) =>
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, items: newItems } } : n)),
      ),
    [id, setNodes],
  );

  const addItem = useCallback(() =>
    updateItems([...items, { id: `${Date.now()}`, label: '', checked: false }]),
    [items, updateItems],
  );

  const removeItem  = useCallback((iid: string) => updateItems(items.filter((i) => i.id !== iid)), [items, updateItems]);
  const toggleItem  = useCallback((iid: string) => updateItems(items.map((i) => i.id === iid ? { ...i, checked: !i.checked } : i)), [items, updateItems]);
  const editLabel   = useCallback((iid: string, label: string) => updateItems(items.map((i) => i.id === iid ? { ...i, label } : i)), [items, updateItems]);

  return (
    <div className="scene-node equip-node">
      <Handle type="target" position={Position.Top} id="top" />

      <div className="node-header equip-header">
        <span className="seq-badge seq-badge-green">S{seqNumber}</span>
        <span className="node-title">Matériel</span>
        <span className="node-type-icon">🎢</span>
      </div>

      <div className="node-body nodrag">
        <div className="equip-list">
          {items.map((item) => (
            <div key={item.id} className="equip-item">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="equip-checkbox"
              />
              <input
                className="equip-label-input"
                placeholder="Matériel, accessoire..."
                value={item.label}
                onChange={(e) => editLabel(item.id, e.target.value)}
              />
              <button className="equip-remove" onClick={() => removeItem(item.id)}>✕</button>
            </div>
          ))}
        </div>
        <button className="add-equip-btn" onClick={addItem}>+ Ajouter un équipement</button>
      </div>
    </div>
  );
}
