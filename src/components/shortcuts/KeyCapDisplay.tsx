import React from 'react';
import type { KeyCombo } from '../../types/shortcuts';
import { KEY_DISPLAY_MAP } from '../../types/shortcuts';
import { adaptKeyComboForPlatform } from '../../data/shortcutStore';

interface KeyCapProps {
  value: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'modifier' | 'key' | 'special';
}

function KeyCap({ value, size = 'md', variant = 'key' }: KeyCapProps) {
  const display =
    KEY_DISPLAY_MAP[value.toLowerCase()] ??
    (value.length === 1 ? value.toUpperCase() : value);

  return (
    <span
      className={`keycap keycap--${size} keycap--${variant}`}
      title={value}
    >
      {display}
    </span>
  );
}

interface KeyComboDisplayProps {
  combo: KeyCombo;
  size?: 'sm' | 'md' | 'lg';
}

export function KeyComboDisplay({ combo, size = 'md' }: KeyComboDisplayProps) {
  const parts: React.ReactNode[] = [];
  const platformCombo = adaptKeyComboForPlatform(combo);

  platformCombo.modifiers.forEach((mod, i) => {
    parts.push(<KeyCap key={`mod-${i}`} value={mod} size={size} variant="modifier" />);
    parts.push(<span key={`sep-${i}`} className="keycap-sep">+</span>);
  });

  if (platformCombo.key) {
    const isSpecial =
      platformCombo.key.length > 1 ||
      Object.keys(KEY_DISPLAY_MAP).includes(platformCombo.key.toLowerCase());
    parts.push(
      <KeyCap key="key" value={platformCombo.key} size={size} variant={isSpecial ? 'special' : 'key'} />
    );
  }

  return <span className="keycap-combo">{parts}</span>;
}

interface KeyComboListProps {
  combos: KeyCombo[];
  size?: 'sm' | 'md' | 'lg';
}

export function KeyComboList({ combos, size = 'md' }: KeyComboListProps) {
  return (
    <span className="keycap-list">
      {combos.map((combo, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="keycap-or">ou</span>}
          <KeyComboDisplay combo={combo} size={size} />
        </React.Fragment>
      ))}
    </span>
  );
}
