import React, { useState } from 'react';
import type { Software } from '../../types/shortcuts';
import { PRESET_SOFTWARES } from '../../types/shortcuts';

interface SoftwarePanelProps {
  softwares: Software[];
  selectedId: string | null;
  activeAppSlug?: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string, icon?: string, slug?: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SoftwarePanel({
  softwares,
  selectedId,
  activeAppSlug,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: SoftwarePanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const existingSlugs = new Set(softwares.map(s => s.slug));

  const handleAddPreset = (preset: typeof PRESET_SOFTWARES[0]) => {
    onAdd(preset.name, preset.icon, preset.slug);
    setShowAddMenu(false);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAdd(customName.trim(), customIcon.trim() || '📌');
    setCustomName('');
    setCustomIcon('');
    setShowAddMenu(false);
  };

  const startEdit = (sw: Software) => {
    setEditingId(sw.id);
    setEditName(sw.name);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) onRename(id, editName.trim());
    setEditingId(null);
  };

  const totalShortcuts = (sw: Software) =>
    sw.categories.reduce(
      (n, c) => n + c.shortcuts.length + c.subcategories.reduce((s, sub) => s + sub.shortcuts.length, 0),
      0
    );

  return (
    <div className="software-panel">
      <div className="software-panel-header">
        <h2 className="software-panel-title">Logiciels</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddMenu(!showAddMenu)}
          title="Ajouter un logiciel"
        >
          +
        </button>
      </div>

      {showAddMenu && (
        <div className="software-add-menu">
          <p className="software-add-section">Suggestions</p>
          <div className="preset-grid">
            {PRESET_SOFTWARES.filter(p => !existingSlugs.has(p.slug)).map(preset => (
              <button
                key={preset.slug}
                className="preset-btn"
                onClick={() => handleAddPreset(preset)}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
          <p className="software-add-section">Personnalisé</p>
          <form className="software-custom-form" onSubmit={handleAddCustom}>
            <input
              className="form-input category-icon-input"
              value={customIcon}
              onChange={e => setCustomIcon(e.target.value)}
              placeholder="🖥️"
              maxLength={2}
            />
            <input
              className="form-input"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Nom du logiciel"
              autoFocus
            />
            <button className="btn btn-primary btn-sm" type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {activeAppSlug && (
        <div className="active-app-hint">
          <span className="active-app-dot" />
          App active détectée
        </div>
      )}

      <div className="software-list">
        {softwares.length === 0 && (
          <div className="software-empty">
            <p>Aucun logiciel.</p>
            <p>Cliquez sur + pour commencer.</p>
          </div>
        )}

        {softwares.map(sw => {
          const isActive = activeAppSlug && sw.slug === activeAppSlug;
          return (
            <div
              key={sw.id}
              className={`software-item ${selectedId === sw.id ? 'software-item--selected' : ''} ${isActive ? 'software-item--active-app' : ''}`}
              onClick={() => onSelect(sw.id)}
            >
              <span className="software-icon">{sw.icon ?? '📌'}</span>

              {editingId === sw.id ? (
                <input
                  className="software-rename-input"
                  value={editName}
                  autoFocus
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => commitEdit(sw.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(sw.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="software-name">
                  {sw.name}
                  {isActive && <span className="active-badge">actif</span>}
                </span>
              )}

              <span className="software-count">{totalShortcuts(sw)}</span>

              <div className="software-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="btn-icon"
                  onClick={() => startEdit(sw)}
                  title="Renommer"
                >✎</button>
                <button
                  className="btn-icon btn-danger-ghost"
                  onClick={() => onDelete(sw.id)}
                  title="Supprimer"
                >✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
