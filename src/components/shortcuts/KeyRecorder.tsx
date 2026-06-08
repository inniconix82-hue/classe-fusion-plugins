import React, { useState, useRef, useCallback } from 'react';
import type { KeyCombo, Modifier } from '../../types/shortcuts';
import { KeyComboDisplay } from './KeyCapDisplay';

interface KeyRecorderProps {
  value: KeyCombo | null;
  onChange: (combo: KeyCombo) => void;
  placeholder?: string;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'OS', 'Win']);
const MODIFIER_MAP: Record<string, Modifier> = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Cmd',
  OS: 'Win',
};

export function KeyRecorder({ value, onChange, placeholder = 'Cliquez puis appuyez…' }: KeyRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [current, setCurrent] = useState<KeyCombo | null>(value);
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setRecording(false);
      return;
    }

    const modifiers: Modifier[] = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');
    if (e.metaKey) modifiers.push('Cmd');

    if (MODIFIER_KEYS.has(e.key)) {
      // Only modifiers pressed — wait for main key
      return;
    }

    const key =
      e.key === ' ' ? 'Space' :
      e.key === 'ArrowUp' ? '↑' :
      e.key === 'ArrowDown' ? '↓' :
      e.key === 'ArrowLeft' ? '←' :
      e.key === 'ArrowRight' ? '→' :
      e.key.length === 1 ? e.key.toUpperCase() :
      e.key;

    const combo: KeyCombo = { modifiers, key };
    setCurrent(combo);
    onChange(combo);
    setRecording(false);
  }, [onChange]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={`key-recorder ${recording ? 'key-recorder--active' : ''}`}
      onKeyDown={recording ? handleKeyDown : undefined}
      onClick={() => { setRecording(true); ref.current?.focus(); }}
      onBlur={() => setRecording(false)}
      role="button"
      aria-label="Enregistrer un raccourci clavier"
    >
      {recording ? (
        <span className="key-recorder-hint">Appuyez sur la combinaison… (Échap pour annuler)</span>
      ) : current ? (
        <KeyComboDisplay combo={current} size="sm" />
      ) : (
        <span className="key-recorder-placeholder">{placeholder}</span>
      )}
    </div>
  );
}
