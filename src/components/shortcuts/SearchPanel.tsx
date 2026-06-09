import React, { useState, useEffect, useCallback } from 'react';
import type { SearchResult, ShortcutDB } from '../../types/shortcuts';
import { searchShortcuts } from '../../data/shortcutStore';
import { KeyComboList } from './KeyCapDisplay';

function physicalKeyName(code: string): string | null {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (/^F\d+$/.test(code)) return code;
  const map: Record<string, string> = {
    Space: 'Space', Backspace: 'Backspace', Delete: 'Delete',
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    Equal: '=', Minus: '-', BracketLeft: '[', BracketRight: ']',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
  };
  return map[code] ?? null;
}

interface SearchPanelProps {
  db: ShortcutDB;
  onNavigate?: (softwareId: string, categoryId: string) => void;
  inline?: boolean;
  onClose?: () => void;
}

export function SearchPanel({ db, onNavigate, inline = false, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const r = searchShortcuts(db, query);
    setResults(r);
    setSelected(0);
  }, [query, db]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navigation
    if (e.key === 'Escape') { onClose?.(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && results[selected]) {
      const r = results[selected];
      onNavigate?.(r.software.id, r.category.id);
      onClose?.();
      return;
    }

    // Combo search: when modifier keys are held, capture the physical combo
    const hasModifier = e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
    const modifierKeys = new Set(['Meta', 'Control', 'Shift', 'Alt', 'CapsLock', 'Tab', 'Dead']);
    // Don't intercept standard text-editing shortcuts (Cmd/Ctrl + A/C/V/X/Z/Y)
    const isEditing = (e.metaKey || e.ctrlKey) && 'acvxzy'.includes(e.key.toLowerCase());
    if (hasModifier && !modifierKeys.has(e.key) && !isEditing) {
      e.preventDefault();
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mods: string[] = [];
      if (e.metaKey || e.ctrlKey) mods.push(isMac ? 'Cmd' : 'Ctrl');
      if (e.shiftKey) mods.push('Shift');
      if (e.altKey) mods.push('Alt');
      const key = (e.key.length === 1 && !(e.altKey && e.key.charCodeAt(0) > 127))
        ? e.key.toUpperCase()
        : physicalKeyName(e.code) ?? e.key;
      setQuery([...mods, key].join('+'));
    }
  }, [results, selected, onNavigate, onClose]);

  return (
    <div className={`search-panel ${inline ? 'search-panel--inline' : 'search-panel--overlay'}`}>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une action ou appuyer sur un raccourci (ex: Shift+M)…"
          autoFocus={!inline}
        />
        {query && (
          <button className="btn-icon" onClick={() => setQuery('')} title="Effacer">✕</button>
        )}
      </div>

      {query && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">Aucun résultat pour « {query} »</div>
          ) : (
            results.slice(0, 50).map((r, i) => (
              <div
                key={`${r.shortcut.id}-${i}`}
                className={`search-result-item ${i === selected ? 'search-result-item--selected' : ''}`}
                onClick={() => { onNavigate?.(r.software.id, r.category.id); onClose?.(); }}
              >
                <div className="search-result-meta">
                  <span className="search-result-app">
                    {r.software.icon ?? ''} {r.software.name}
                  </span>
                  <span className="search-result-cat">
                    {r.category.icon ?? ''} {r.category.name}
                    {r.subcategory && ` › ${r.subcategory.name}`}
                  </span>
                </div>
                <div className="search-result-main">
                  <span className="search-result-action">{r.shortcut.action}</span>
                  <KeyComboList combos={r.shortcut.keys} size="sm" />
                </div>
                {r.shortcut.note && (
                  <div className="search-result-note">{r.shortcut.note}</div>
                )}
              </div>
            ))
          )}
          {results.length > 50 && (
            <div className="search-more">{results.length - 50} résultats supplémentaires — affinez la recherche.</div>
          )}
        </div>
      )}
    </div>
  );
}
