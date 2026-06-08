import React, { useState, useEffect, useCallback } from 'react';
import type { SearchResult, ShortcutDB } from '../../types/shortcuts';
import { searchShortcuts } from '../../data/shortcutStore';
import { KeyComboList } from './KeyCapDisplay';

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      const r = results[selected];
      onNavigate?.(r.software.id, r.category.id);
      onClose?.();
    } else if (e.key === 'Escape') {
      onClose?.();
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
          placeholder="Rechercher un raccourci, une action…"
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
