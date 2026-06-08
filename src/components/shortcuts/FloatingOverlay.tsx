import React, { useState, useEffect, useRef } from 'react';
import type { ShortcutDB } from '../../types/shortcuts';
import { loadDB } from '../../data/shortcutStore';
import { KeyComboList } from './KeyCapDisplay';
import { SearchPanel } from './SearchPanel';

type Tab = 'search' | 'shortcuts' | 'settings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eAPI = () => (window as any).electronAPI as Record<string, any> | undefined;

export function FloatingOverlay() {
  const [db, setDb] = useState<ShortcutDB>(() => loadDB());
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('search');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hotkey, setHotkey] = useState('CommandOrControl+Shift+K');
  const [hotkeyInput, setHotkeyInput] = useState('');
  const [hotkeyMsg, setHotkeyMsg] = useState('');
  const recordingRef = useRef(false);

  useEffect(() => {
    const api = eAPI();
    api?.getTheme?.().then((t: string) => { if (t) setTheme(t as 'dark' | 'light'); });
    api?.getHotkey?.().then((k: string) => { if (k) { setHotkey(k); setHotkeyInput(k); } });
  }, []);

  // Apply theme class to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    document.body.style.background = theme === 'dark' ? '#1a1e2e' : '#f0f2f5';
  }, [theme]);

  // Active app detection
  useEffect(() => {
    eAPI()?.onActiveApp?.((slug: string) => {
      const match = db.softwares.find(s => s.slug === slug);
      if (match) setSelectedSoftwareId(match.id);
    });
  }, [db]);

  // Reload DB on storage change (main window edits)
  useEffect(() => {
    const handler = () => setDb(loadDB());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') window.close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const selectedSoftware = db.softwares.find(s => s.id === selectedSoftwareId) ?? db.softwares[0] ?? null;
  const selectedCategory = selectedSoftware?.categories.find(c => c.id === selectedCategoryId) ?? selectedSoftware?.categories[0] ?? null;

  const bg = theme === 'dark' ? '#1a1e2e' : '#f0f2f5';
  const border = theme === 'dark' ? '#2d3352' : '#d1d5db';
  const text = theme === 'dark' ? '#e2e8f0' : '#111827';
  const muted = theme === 'dark' ? '#64748b' : '#6b7280';
  const rowHover = theme === 'dark' ? '#232840' : '#e5e7eb';
  const accent = '#6366f1';

  // Hotkey record handler
  const handleHotkeyKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingRef.current) return;
    e.preventDefault();
    const mods: string[] = [];
    if (e.metaKey) mods.push('CommandOrControl');
    else if (e.ctrlKey) mods.push('CommandOrControl');
    if (e.shiftKey) mods.push('Shift');
    if (e.altKey) mods.push('Alt');
    const ignored = new Set(['Meta', 'Control', 'Shift', 'Alt']);
    if (ignored.has(e.key)) return;
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const combo = [...mods, key].join('+');
    setHotkeyInput(combo);
    recordingRef.current = false;
  };

  const saveHotkey = async () => {
    const res = await eAPI()?.setHotkey?.(hotkeyInput);
    if (res?.ok) { setHotkey(hotkeyInput); setHotkeyMsg('✓ Raccourci enregistré'); }
    else setHotkeyMsg('⚠ Combinaison non disponible');
    setTimeout(() => setHotkeyMsg(''), 3000);
  };

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: bg,
      color: text,
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      borderRadius: 10,
      overflow: 'hidden',
      border: `1px solid ${border}`,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
        background: theme === 'dark' ? '#141827' : '#e5e7eb',
        // @ts-ignore
        WebkitAppRegion: 'drag',
        flexShrink: 0,
        borderBottom: `1px solid ${border}`,
      }}>
        {/* Software picker */}
        <select
          value={selectedSoftware?.id ?? ''}
          onChange={e => { setSelectedSoftwareId(e.target.value); setSelectedCategoryId(null); }}
          style={{
            background: theme === 'dark' ? '#232840' : '#fff',
            border: `1px solid ${border}`, borderRadius: 6,
            padding: '3px 8px', color: text, fontSize: 12,
            cursor: 'pointer', // @ts-ignore
            WebkitAppRegion: 'no-drag',
          }}
        >
          {db.softwares.map(sw => (
            <option key={sw.id} value={sw.id}>{sw.icon} {sw.name}</option>
          ))}
        </select>

        {/* Tabs */}
        {/* @ts-ignore */}
        <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center', WebkitAppRegion: 'no-drag' }}>
          {(['search', 'shortcuts', 'settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none', fontSize: 11,
              cursor: 'pointer', transition: 'all 0.1s',
              background: tab === t ? accent : 'transparent',
              color: tab === t ? '#fff' : muted,
              fontWeight: tab === t ? 600 : 400,
            }}>
              {t === 'search' ? '🔍 Recherche' : t === 'shortcuts' ? '⌨ Raccourcis' : '⚙️'}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.close()}
          style={{
            width: 20, height: 20, borderRadius: 4, border: 'none',
            background: 'transparent', color: muted, cursor: 'pointer', fontSize: 13,
            // @ts-ignore
            WebkitAppRegion: 'no-drag',
          }}
          title="Fermer (Échap)"
        >✕</button>
      </div>

      {/* Search tab */}
      {tab === 'search' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SearchPanel
            db={db}
            inline
            onNavigate={(swId, catId) => {
              setSelectedSoftwareId(swId);
              setSelectedCategoryId(catId);
              setTab('shortcuts');
            }}
          />
        </div>
      )}

      {/* Shortcuts tab */}
      {tab === 'shortcuts' && selectedSoftware && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Category list */}
          <div style={{
            width: 130, padding: '6px 5px', borderRight: `1px solid ${border}`,
            overflowY: 'auto', flexShrink: 0,
          }}>
            {selectedSoftware.categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                width: '100%', padding: '6px 8px', borderRadius: 5,
                border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                background: selectedCategory?.id === cat.id ? accent : 'transparent',
                color: selectedCategory?.id === cat.id ? '#fff' : text,
                transition: 'all 0.1s',
              }}>
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Shortcuts table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {selectedCategory && (
              <>
                {selectedCategory.shortcuts.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 4px', borderBottom: `1px solid ${border}`, fontSize: 12,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: text }}>{s.action}</span>
                    <KeyComboList combos={s.keys} size="sm" />
                  </div>
                ))}
                {selectedCategory.subcategories.map(sub => (
                  <React.Fragment key={sub.id}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: muted, padding: '8px 4px 3px', letterSpacing: '0.06em' }}>
                      {sub.name}
                    </div>
                    {sub.shortcuts.map(s => (
                      <div key={s.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '5px 4px', borderBottom: `1px solid ${border}`, fontSize: 12,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ color: text }}>{s.action}</span>
                        <KeyComboList combos={s.keys} size="sm" />
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: muted, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Raccourci global
            </p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div
                tabIndex={0}
                onKeyDown={handleHotkeyKeyDown}
                onClick={() => { recordingRef.current = true; }}
                onBlur={() => { recordingRef.current = false; }}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 13,
                  background: theme === 'dark' ? '#232840' : '#fff',
                  border: `1px solid ${border}`,
                  color: text, cursor: 'pointer', outline: 'none',
                  fontFamily: 'monospace',
                }}
              >
                {hotkeyInput || hotkey}
              </div>
              <button onClick={saveHotkey} style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: accent, color: '#fff', fontSize: 12, cursor: 'pointer',
              }}>
                Sauver
              </button>
            </div>
            {hotkeyMsg && <p style={{ fontSize: 11, color: hotkeyMsg.startsWith('✓') ? '#22c55e' : '#f59e0b', marginTop: 6 }}>{hotkeyMsg}</p>}
            <p style={{ fontSize: 11, color: muted, marginTop: 6 }}>
              Clique sur le champ et appuie sur la combinaison souhaitée.
            </p>
          </div>

          <div>
            <p style={{ fontSize: 11, color: muted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Raccourci actuel
            </p>
            <p style={{ fontSize: 13, fontFamily: 'monospace', color: text }}>
              {hotkey.replace('CommandOrControl', '⌘/Ctrl')}
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: muted, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gérer les raccourcis
            </p>
            <button
              onClick={() => window.electronAPI && (window as any).electronAPI?.openMainWindow?.()}
              style={{
                padding: '6px 12px', borderRadius: 6, border: `1px solid ${border}`,
                background: 'transparent', color: text, fontSize: 12, cursor: 'pointer', width: '100%',
              }}
            >
              Ouvrir l'application principale
            </button>
          </div>
        </div>
      )}

      {db.softwares.length === 0 && tab !== 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: muted, fontSize: 13, textAlign: 'center', padding: 20, gap: 8 }}>
          <span style={{ fontSize: 28 }}>⌨️</span>
          <p>Aucun raccourci enregistré.</p>
          <p>Ouvre l'app principale pour commencer.</p>
        </div>
      )}
    </div>
  );
}
