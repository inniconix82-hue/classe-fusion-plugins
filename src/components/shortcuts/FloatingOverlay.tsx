/**
 * Floating overlay shown when triggered by global hotkey.
 * Renders in a minimal window with auto-detected or manually selected software.
 */
import React, { useState, useEffect } from 'react';
import type { ShortcutDB, Software, Category, Shortcut } from '../../types/shortcuts';
import { loadDB } from '../../data/shortcutStore';
import { KeyComboList } from './KeyCapDisplay';
import { SearchPanel } from './SearchPanel';

export function FloatingOverlay() {
  const [db, setDb] = useState<ShortcutDB>(() => loadDB());
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<'shortcuts' | 'search'>('shortcuts');

  // Receive active-app signal from Electron preload
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'ACTIVE_APP_SLUG') {
        const slug = e.data.slug as string;
        const match = db.softwares.find(s => s.slug === slug);
        if (match) setSelectedSoftwareId(match.id);
      }
    };
    window.addEventListener('message', handler);
    // Also check electronAPI if available
    const api = (window as typeof window & { electronAPI?: { onActiveApp?: (cb: (slug: string) => void) => void } }).electronAPI;
    api?.onActiveApp?.((slug: string) => {
      const match = db.softwares.find(s => s.slug === slug);
      if (match) setSelectedSoftwareId(match.id);
    });
    return () => window.removeEventListener('message', handler);
  }, [db]);

  // Reload DB from storage on every open (storage event or periodic)
  useEffect(() => {
    const handler = () => setDb(loadDB());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const selectedSoftware = db.softwares.find(s => s.id === selectedSoftwareId) ?? db.softwares[0] ?? null;
  const selectedCategory = selectedSoftware?.categories.find(c => c.id === selectedCategoryId) ?? selectedSoftware?.categories[0] ?? null;

  return (
    <div className="floating-overlay">
      <div className="overlay-toolbar">
        <div className="overlay-app-select">
          <select
            className="overlay-select"
            value={selectedSoftware?.id ?? ''}
            onChange={e => { setSelectedSoftwareId(e.target.value); setSelectedCategoryId(null); }}
          >
            {db.softwares.map(sw => (
              <option key={sw.id} value={sw.id}>{sw.icon} {sw.name}</option>
            ))}
          </select>
        </div>

        <div className="overlay-tabs">
          <button
            className={`overlay-tab ${view === 'shortcuts' ? 'overlay-tab--active' : ''}`}
            onClick={() => setView('shortcuts')}
          >Raccourcis</button>
          <button
            className={`overlay-tab ${view === 'search' ? 'overlay-tab--active' : ''}`}
            onClick={() => setView('search')}
          >Recherche</button>
        </div>

        <button
          className="btn-icon overlay-close"
          onClick={() => window.close()}
          title="Fermer (Échap)"
        >✕</button>
      </div>

      {view === 'search' && (
        <SearchPanel db={db} inline />
      )}

      {view === 'shortcuts' && selectedSoftware && (
        <div className="overlay-body">
          <div className="overlay-categories">
            {selectedSoftware.categories.map(cat => (
              <button
                key={cat.id}
                className={`overlay-cat-btn ${selectedCategory?.id === cat.id ? 'overlay-cat-btn--active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="overlay-shortcuts">
              <OverlayShortcutTable shortcuts={selectedCategory.shortcuts} />
              {selectedCategory.subcategories.map(sub => (
                <div key={sub.id}>
                  <div className="overlay-sub-title">{sub.name}</div>
                  <OverlayShortcutTable shortcuts={sub.shortcuts} />
                </div>
              ))}
            </div>
          )}

          {!selectedCategory && (
            <div className="overlay-empty">Sélectionnez une catégorie</div>
          )}
        </div>
      )}

      {db.softwares.length === 0 && (
        <div className="overlay-empty">
          <p>Aucun raccourci enregistré.</p>
          <p>Ouvrez l'application principale pour commencer.</p>
        </div>
      )}
    </div>
  );
}

function OverlayShortcutTable({ shortcuts }: { shortcuts: Shortcut[] }) {
  if (shortcuts.length === 0) return null;
  return (
    <table className="overlay-table">
      <tbody>
        {shortcuts.map(s => (
          <tr key={s.id} className="overlay-row">
            <td className="overlay-action">{s.action}</td>
            <td className="overlay-keys">
              <KeyComboList combos={s.keys} size="sm" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
