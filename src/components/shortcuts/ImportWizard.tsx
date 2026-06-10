import React, { useState, useCallback } from 'react';
import { autoImport, detectCSVInfo, parseCSVWithMapping } from '../../data/shortcutImporters';
import type { ImportResult, CSVInfo, CSVColumnMapping } from '../../data/shortcutImporters';

interface ImportWizardProps {
  onImport: (result: ImportResult, softwareName: string) => void;
  onClose: () => void;
}

const UNSET = -1;
const NONE_LABEL = '— non mappé —';

function emptyMapping(info: CSVInfo): CSVColumnMapping {
  const h = info.headers.map(x => x.toLowerCase());
  const find = (aliases: string[]) => { for (const a of aliases) { const i = h.indexOf(a); if (i !== -1) return i; } return UNSET; };
  return {
    delimiter: info.delimiter,
    hasHeader: info.hasHeader,
    actionCol:      find(['action','name','nom','command','commande','fonction','label','title']),
    keysCol:        find(['keys','key','shortcut','raccourci','binding','touche','touches','combo','hotkey']),
    categoryCol:    find(['category','catégorie','categorie','cat','group','groupe','section']),
    subcategoryCol: find(['subcategory','sous-catégorie','sous-categorie','sub','subcat']),
    noteCol:        find(['note','notes','comment','commentaire']),
  };
}

export function ImportWizard({ onImport, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [customName, setCustomName] = useState('');
  const [filename, setFilename] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [csvInfo, setCsvInfo] = useState<CSVInfo | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback((file: File) => {
    setFilename(file.name);
    setCustomName(prev => prev || guessName(file.name));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawContent(text);
      const name = customName || guessName(file.name);
      const res = autoImport(text, file.name, name);
      const total = countShortcuts(res);
      if (total === 0) {
        // Auto-import failed — show column mapper for CSV-like files
        const info = detectCSVInfo(text);
        if (info.headers.length >= 2) {
          setCsvInfo(info);
          setMapping(emptyMapping(info));
          setStep('mapping');
          return;
        }
      }
      setResult(res);
      setStep('preview');
    };
    reader.onerror = () => setError('Impossible de lire le fichier.');
    reader.readAsText(file, 'utf-8');
  }, [customName]);

  const applyMapping = () => {
    if (!mapping || !csvInfo) return;
    const name = customName || guessName(filename);
    const res = parseCSVWithMapping(rawContent, name, mapping);
    setResult(res);
    setStep('preview');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleConfirm = () => {
    if (!result) return;
    onImport(result, customName || result.software.name);
    setStep('done');
  };

  const totalShortcuts = countShortcuts(result);

  const delimLabel = (d: string) => d === '\t' ? 'Tab' : d === ',' ? 'Virgule (,)' : d === ';' ? 'Point-virgule (;)' : d === '|' ? 'Pipe (|)' : d;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel import-wizard" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Importer des raccourcis</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {step === 'upload' && (
          <div className="import-step">
            <p className="import-hint">
              Formats supportés : DaVinci Resolve <code>.keyb</code>, VS Code <code>keybindings.json</code>, Photoshop <code>.kys</code>, CSV/TXT générique.
            </p>
            <div
              className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <span className="drop-zone-icon">📂</span>
              <p>Déposez votre fichier ici</p>
              <p className="drop-zone-sub">ou</p>
              <label className="btn btn-primary">
                Choisir un fichier
                <input type="file" accept=".keyb,.json,.kys,.csv,.txt,.xml" style={{ display: 'none' }} onChange={handleFileInput} />
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="import-manual-name">
              <label className="form-label">
                Nom du logiciel (optionnel)
                <input className="form-input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="ex : DaVinci Resolve 18" />
              </label>
            </div>
            <div className="import-formats-guide">
              <h4>Comment exporter depuis votre logiciel :</h4>
              <ul>
                <li><strong>DaVinci Resolve :</strong> Keyboard Customization → Export → <code>.keyb</code></li>
                <li><strong>VS Code :</strong> Preferences → Keyboard Shortcuts → icône JSON → <code>keybindings.json</code></li>
                <li><strong>Photoshop :</strong> Édition → Raccourcis clavier → Résumé</li>
                <li><strong>Autre :</strong> CSV avec colonnes <code>action, keys, category, note</code></li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && csvInfo && mapping && (
          <div className="import-step">
            <p className="import-hint" style={{ marginBottom: 12 }}>
              La détection automatique n'a pas reconnu le format. Indiquez quelle colonne correspond à quoi.
            </p>

            {/* Raw file preview table */}
            <div style={{ overflowX: 'auto', marginBottom: 14, borderRadius: 6, border: '1px solid #333' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {csvInfo.headers.map((h, i) => (
                      <th key={i} style={{ padding: '4px 8px', background: '#2a2a2a', color: '#d97757', borderBottom: '1px solid #444', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {h || `col${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvInfo.sampleRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      {csvInfo.headers.map((_, ci) => (
                        <td key={ci} style={{ padding: '3px 8px', color: '#ccc', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[ci] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Delimiter selector */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ color: '#888', fontSize: 12 }}>Délimiteur :</span>
              {[',', ';', '\t', '|'].map(d => (
                <button
                  key={d}
                  onClick={() => setMapping(m => m ? { ...m, delimiter: d } : m)}
                  style={{
                    padding: '3px 10px', borderRadius: 5, border: `1px solid ${mapping.delimiter === d ? '#d97757' : '#444'}`,
                    background: mapping.delimiter === d ? 'rgba(217,119,87,0.15)' : 'transparent',
                    color: mapping.delimiter === d ? '#d97757' : '#aaa', fontSize: 12, cursor: 'pointer'
                  }}
                >{delimLabel(d)}</button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12, marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={mapping.hasHeader}
                  onChange={e => setMapping(m => m ? { ...m, hasHeader: e.target.checked } : m)}
                />
                Première ligne = en-tête
              </label>
            </div>

            {/* Column mapping dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {([
                ['Action *', 'actionCol'],
                ['Raccourci *', 'keysCol'],
                ['Catégorie', 'categoryCol'],
                ['Sous-catégorie', 'subcategoryCol'],
                ['Note', 'noteCol'],
              ] as [string, keyof CSVColumnMapping][]).map(([label, field]) => (
                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{label}</span>
                  <select
                    value={mapping[field] as number}
                    onChange={e => setMapping(m => m ? { ...m, [field]: Number(e.target.value) } : m)}
                    style={{ padding: '5px 8px', borderRadius: 5, background: '#1e1e1e', border: '1px solid #444', color: '#eee', fontSize: 12 }}
                  >
                    <option value={UNSET}>{NONE_LABEL}</option>
                    {csvInfo.headers.map((h, i) => (
                      <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStep('upload')}>Retour</button>
              <button
                className="btn btn-primary"
                onClick={applyMapping}
                disabled={mapping.actionCol === UNSET || mapping.keysCol === UNSET}
              >
                Aperçu →
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && result && (
          <div className="import-step">
            <div className="import-preview-header">
              <span className="import-preview-icon">{result.software.icon ?? '📦'}</span>
              <div>
                <input className="form-input import-name-input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nom du logiciel" />
                <p className="import-preview-stats">{result.software.categories.length} catégorie(s) · {totalShortcuts} raccourcis</p>
              </div>
            </div>
            {result.warnings.length > 0 && (
              <div className="import-warnings">
                {result.warnings.slice(0, 5).map((w, i) => <p key={i} className="import-warning">⚠️ {w}</p>)}
                {result.warnings.length > 5 && <p className="import-warning">… et {result.warnings.length - 5} autre(s) avertissement(s).</p>}
              </div>
            )}
            <div className="import-preview-list">
              {result.software.categories.map(cat => (
                <div key={cat.id} className="import-preview-cat">
                  <strong>{cat.icon ?? ''} {cat.name}</strong>
                  <span className="import-preview-count">{cat.shortcuts.length + cat.subcategories.reduce((n, s) => n + s.shortcuts.length, 0)} raccourcis</span>
                </div>
              ))}
            </div>
            {totalShortcuts === 0 && (
              <p className="import-warning">Aucun raccourci extrait. <button className="btn btn-ghost btn-sm" onClick={() => setStep('mapping')} style={{marginLeft:8}}>Configurer le mapping</button></p>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStep(csvInfo ? 'mapping' : 'upload')}>Retour</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={totalShortcuts === 0}>
                Importer {totalShortcuts} raccourcis
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="import-step import-step--done">
            <span className="import-done-icon">✅</span>
            <h3>Import réussi !</h3>
            <p>{totalShortcuts} raccourcis importés depuis <strong>{filename}</strong>.</p>
            <button className="btn btn-primary" onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function countShortcuts(result: ImportResult | null): number {
  return result?.software.categories.reduce(
    (n, c) => n + c.shortcuts.length + c.subcategories.reduce((s, sub) => s + sub.shortcuts.length, 0), 0
  ) ?? 0;
}

function guessName(filename: string): string {
  const base = filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
  if (/davinci|resolve/i.test(base)) return 'DaVinci Resolve';
  if (/photoshop|psd/i.test(base)) return 'Photoshop';
  if (/premiere/i.test(base)) return 'Premiere Pro';
  if (/vscode|code/i.test(base)) return 'VS Code';
  if (/blender/i.test(base)) return 'Blender';
  return base.charAt(0).toUpperCase() + base.slice(1);
}
