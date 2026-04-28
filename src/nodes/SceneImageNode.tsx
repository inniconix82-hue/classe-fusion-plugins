import { useState, useCallback, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface SceneImageData {
  seqNumber: number;
  image: string | null;
}

export default function SceneImageNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { seqNumber, image } = data as unknown as SceneImageData;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateImage = useCallback(
    (dataUrl: string | null) =>
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, image: dataUrl } } : n)),
      ),
    [id, setNodes],
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => updateImage(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [updateImage],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile],
  );

  return (
    <div className="scene-node scene-image-node">
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="node-header scene-header">
        <span className="seq-badge">S{seqNumber}</span>
        <span className="node-title">Scène {seqNumber}</span>
        <span className="node-type-icon">🎬</span>
      </div>

      <div
        className={`image-drop-zone${isDragging ? ' dragging' : ''}${image ? ' has-image' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        {image ? (
          <>
            <img src={image} alt={`Scène ${seqNumber}`} className="scene-image" />
            <button
              className="clear-image-btn nodrag"
              onClick={(e) => { e.stopPropagation(); updateImage(null); }}
            >
              ✕
            </button>
          </>
        ) : (
          <div className="drop-placeholder">
            <span className="drop-icon">🖼️</span>
            <span className="drop-text">Glisser une image</span>
            <span className="drop-sub">ou cliquer pour parcourir</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
        className="nodrag"
      />
    </div>
  );
}
