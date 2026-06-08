import React, { useState, useCallback } from 'react';
import { autoImport } from '../../data/shortcutImporters';
import type { ImportResult } from '../../data/shortcutImporters';

interface ImportWizardProps {
  onImport: (result: ImportResult, softwareName: string) => void;
  onClose: () => void;
}

export function ImportWizard({ onImport, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [customName, setCustomName] = useState('');
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback((file: File) => {
    setFilename(file.name);
    setCustomName(prev => prev || guessName(file.name));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const res = autoImport(text, file.name, customName || guessName(file.name));
      setResult(res);
      setStep('preview');
    };
    reader.onerror = () => setError('Impossible de lire le fichier.');
    reader.readAsText(file, 'utf-8');
  }, [customName]);

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

  const totalShortcuts = result?.software.categories.reduce(
    (n, c) =>
      n + c.shortcuts.length + c.subcategories.reduce((s, sub) => s + sub.shortcuts.length, 0),
    0
  ) ?? 0;

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
              Formats supportés : DaVinci Resolve <code>.keyb</code>, VS Code <code>keybindings.json</code>, Photoshop <code>.kys</code>, CSV générique.
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
                <input
                  type="file"
                  accept=".keyb,.json,.kys,.csv,.txt,.xml"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="import-manual-name">
              <label className="form-label">
                Nom du logiciel (optionnel)
                <input
                  className="form-input"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="ex : DaVinci Resolve 18"
                />
              </label>
            </div>

            <div className="import-formats-guide">
              <h4>Comment exporter depuis votre logiciel :</h4>
              <ul>
                <li><strong>DaVinci Resolve :</strong> DaVinci Resolve &gt; Keyboard Customization &gt; Export → fichier <code>.keyb</code></li>
                <li><strong>VS Code :</strong> Preferences &gt; Keyboard Shortcuts &gt; icône JSON en haut à droite → <code>keybindings.json</code></li>
                <li><strong>Photoshop :</strong> Édition &gt; Raccourcis clavier &gt; Résumé — copier dans un CSV</li>
                <li><strong>Autre :</strong> Créez un CSV avec les colonnes <code>action,keys,category,note</code></li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && result && (
          <div className="import-step">
            <div className="import-preview-header">
              <span className="import-preview-icon">{result.software.icon ?? '📦'}</span>
              <div>
                <input
                  className="form-input import-name-input"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Nom du logiciel"
                />
                <p className="import-preview-stats">
                  {result.software.categories.length} catégorie(s) · {totalShortcuts} raccourcis
                </p>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="import-warnings">
                {result.warnings.map((w, i) => (
                  <p key={i} className="import-warning">⚠️ {w}</p>
                ))}
              </div>
            )}

            <div className="import-preview-list">
              {result.software.categories.map(cat => (
                <div key={cat.id} className="import-preview-cat">
                  <strong>{cat.icon ?? ''} {cat.name}</strong>
                  <span className="import-preview-count">
                    {cat.shortcuts.length + cat.subcategories.reduce((n, s) => n + s.shortcuts.length, 0)} raccourcis
                  </span>
                </div>
              ))}
            </div>

            {totalShortcuts === 0 && (
              <p className="import-warning">
                Aucun raccourci n'a été extrait. Vérifiez le format du fichier.
              </p>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStep('upload')}>Retour</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={totalShortcuts === 0}
              >
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

function guessName(filename: string): string {
  const base = filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
  if (/davinci|resolve/i.test(base)) return 'DaVinci Resolve';
  if (/photoshop|psd/i.test(base)) return 'Photoshop';
  if (/premiere/i.test(base)) return 'Premiere Pro';
  if (/vscode|code/i.test(base)) return 'VS Code';
  if (/blender/i.test(base)) return 'Blender';
  return base.charAt(0).toUpperCase() + base.slice(1);
}
