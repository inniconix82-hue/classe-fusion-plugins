import React, { useState, useEffect, useRef } from 'react';
import type { ShortcutDB } from '../../types/shortcuts';
import { loadDB, saveDB, addShortcut, addCategory, parseKeyComboString } from '../../data/shortcutStore';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingShortcut, setAddingShortcut] = useState(false);
  const [newAction, setNewAction] = useState('');
  const [newKeys, setNewKeys] = useState('');
  const recordingRef = useRef(false);

  useEffect(() => {
    const api = eAPI();
    api?.getTheme?.().then((t: string) => { if (t) setTheme(t as 'dark' | 'light'); });
    api?.getHotkey?.().then((k: string) => { if (k) { setHotkey(k); setHotkeyInput(k); } });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    document.body.style.background = theme === 'dark' ? '#1c1c1c' : '#f0f2f5';
  }, [theme]);

  useEffect(() => {
    eAPI()?.onActiveApp?.((slug: string) => {
      const match = db.softwares.find(s => s.slug === slug);
      if (match) setSelectedSoftwareId(match.id);
    });
  }, [db]);

  useEffect(() => {
    const handler = () => setDb(loadDB());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') window.close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menuOpen]);

  const selectedSoftware = db.softwares.find(s => s.id === selectedSoftwareId) ?? db.softwares[0] ?? null;
  const selectedCategory = selectedSoftware?.categories.find(c => c.id === selectedCategoryId) ?? selectedSoftware?.categories[0] ?? null;

  // Claude-inspired dark gray palette
  const bg = theme === 'dark' ? '#1c1c1c' : '#f0f2f5';
  const toolbarBg = theme === 'dark' ? '#141414' : '#e5e7eb';
  const border = theme === 'dark' ? '#333333' : '#d1d5db';
  const text = theme === 'dark' ? '#f0f0f0' : '#111827';
  const muted = theme === 'dark' ? '#888888' : '#6b7280';
  const rowHover = theme === 'dark' ? '#2a2a2a' : '#e5e7eb';
  const inputBg = theme === 'dark' ? '#252525' : '#ffffff';
  const btnWhite = theme === 'dark' ? '#ffffff' : '#d97757';
  const btnWhiteText = theme === 'dark' ? '#1c1c1c' : '#ffffff';

  const handleHotkeyKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingRef.current) return;
    e.preventDefault();
    const mods: string[] = [];
    if (e.metaKey || e.ctrlKey) mods.push('CommandOrControl');
    if (e.shiftKey) mods.push('Shift');
    if (e.altKey) mods.push('Alt');
    const ignored = new Set(['Meta', 'Control', 'Shift', 'Alt']);
    if (ignored.has(e.key)) return;
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    setHotkeyInput([...mods, key].join('+'));
    recordingRef.current = false;
  };

  const saveHotkey = async () => {
    const res = await eAPI()?.setHotkey?.(hotkeyInput);
    if (res?.ok) { setHotkey(hotkeyInput); setHotkeyMsg('✓ Raccourci enregistré'); }
    else setHotkeyMsg('⚠ Combinaison non disponible');
    setTimeout(() => setHotkeyMsg(''), 3000);
  };

  const saveNewShortcut = () => {
    if (!newAction.trim() || !newKeys.trim() || !selectedSoftware) return;

    let workingDb = db;
    let catId = selectedCategory?.id ?? null;

    // Auto-create a "Général" category if the software has none
    if (!catId) {
      workingDb = addCategory(workingDb, selectedSoftware.id, { name: 'Général' });
      const updatedSw = workingDb.softwares.find(s => s.id === selectedSoftware.id);
      catId = updatedSw?.categories.slice(-1)[0]?.id ?? null;
      if (!catId) return;
    }

    const combo = parseKeyComboString(newKeys);
    const updatedDb = addShortcut(workingDb, selectedSoftware.id, catId, null, {
      action: newAction.trim(),
      keys: [combo],
    });
    saveDB(updatedDb);
    setDb(updatedDb);
    setNewAction('');
    setNewKeys('');
    setAddingShortcut(false);
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 5,
    padding: '4px 8px',
    color: text,
    fontSize: 12,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
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
        background: toolbarBg,
        // @ts-ignore
        WebkitAppRegion: 'drag',
        flexShrink: 0,
        borderBottom: `1px solid ${border}`,
      }}>
        {/* Software picker + dropdown menu */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
          <select
            value={selectedSoftware?.id ?? ''}
            onChange={e => { setSelectedSoftwareId(e.target.value); setSelectedCategoryId(null); }}
            style={{
              background: inputBg,
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

          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              padding: '3px 7px', borderRadius: 5,
              border: `1px solid ${border}`,
              background: menuOpen ? btnWhite : inputBg,
              color: menuOpen ? btnWhiteText : muted,
              cursor: 'pointer', fontSize: 11,
              // @ts-ignore
              WebkitAppRegion: 'no-drag',
            }}
            title="Menu"
          >▾</button>

          {menuOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 200,
                background: toolbarBg, border: `1px solid ${border}`,
                borderRadius: 7, padding: 4, minWidth: 210,
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => { eAPI()?.openMainWindow?.(); setMenuOpen(false); }}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px',
                  background: 'transparent', border: 'none', borderRadius: 5,
                  color: text, fontSize: 12, textAlign: 'left', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >🖥 Ouvrir l'application principale</button>
              <div style={{ height: 1, background: border, margin: '2px 8px' }} />
              <button
                onClick={() => { setTab('settings'); setMenuOpen(false); }}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px',
                  background: 'transparent', border: 'none', borderRadius: 5,
                  color: text, fontSize: 12, textAlign: 'left', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >⚙️ Paramètres du raccourci</button>
              <div style={{ height: 1, background: border, margin: '2px 8px' }} />
              <button
                onClick={() => { window.close(); }}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px',
                  background: 'transparent', border: 'none', borderRadius: 5,
                  color: muted, fontSize: 12, textAlign: 'left', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >✕ Fermer</button>
            </div>
          )}
        </div>

        {/* Tabs: search + shortcuts only (settings via dropdown) */}
        {/* @ts-ignore */}
        <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center', WebkitAppRegion: 'no-drag' }}>
          {(['search', 'shortcuts'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none', fontSize: 11,
              cursor: 'pointer', transition: 'all 0.1s',
              background: tab === t ? btnWhite : 'transparent',
              color: tab === t ? btnWhiteText : muted,
              fontWeight: tab === t ? 600 : 400,
            }}>
              {t === 'search' ? '🔍 Recherche' : '⌨ Raccourcis'}
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Category list */}
            <div style={{
              width: 130, padding: '6px 5px', borderRight: `1px solid ${border}`,
              overflowY: 'auto', flexShrink: 0,
            }}>
              {selectedSoftware.categories.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setAddingShortcut(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  width: '100%', padding: '6px 8px', borderRadius: 5,
                  border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 12,
                  background: selectedCategory?.id === cat.id ? btnWhite : 'transparent',
                  color: selectedCategory?.id === cat.id ? btnWhiteText : text,
                  transition: 'all 0.1s',
                }}>
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Shortcuts list */}
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

          {/* Add shortcut form */}
          <div style={{ borderTop: `1px solid ${border}`, padding: '8px 10px', flexShrink: 0, background: toolbarBg }}>
            {!addingShortcut ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setAddingShortcut(true)}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6,
                    border: 'none', background: btnWhite,
                    color: btnWhiteText, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  }}
                >＋ Créer un raccourci</button>
                <button
                  onClick={() => eAPI()?.openMainWindow?.()}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6,
                    border: `1px solid ${border}`, background: 'transparent',
                    color: text, fontSize: 12, cursor: 'pointer',
                  }}
                >🖥 App principale</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  autoFocus
                  placeholder="Nom de l'action..."
                  value={newAction}
                  onChange={e => setNewAction(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Raccourci (ex: Cmd+Shift+K)"
                  value={newKeys}
                  onChange={e => setNewKeys(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNewShortcut(); }}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={saveNewShortcut}
                    style={{
                      flex: 1, padding: '5px', borderRadius: 5, border: 'none',
                      background: btnWhite, color: btnWhiteText,
                      fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    }}
                  >Sauver</button>
                  <button
                    onClick={() => { setAddingShortcut(false); setNewAction(''); setNewKeys(''); }}
                    style={{
                      flex: 1, padding: '5px', borderRadius: 5,
                      border: `1px solid ${border}`, background: 'transparent',
                      color: muted, fontSize: 12, cursor: 'pointer',
                    }}
                  >Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings tab (accessible via ▾ dropdown) */}
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
                  background: inputBg, border: `1px solid ${border}`,
                  color: text, cursor: 'pointer', outline: 'none',
                  fontFamily: 'monospace',
                }}
              >
                {hotkeyInput || hotkey}
              </div>
              <button onClick={saveHotkey} style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: btnWhite, color: btnWhiteText, fontSize: 12, cursor: 'pointer', fontWeight: 600,
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
            <button
              onClick={() => eAPI()?.openMainWindow?.()}
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
