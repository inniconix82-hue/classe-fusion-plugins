import React, { useState, useEffect } from 'react';
import type { Shortcut, KeyCombo, Category, SubCategory } from '../../types/shortcuts';
import { KeyRecorder } from './KeyRecorder';
import { KeyComboDisplay } from './KeyCapDisplay';

interface ShortcutFormProps {
  initial?: Partial<Shortcut>;
  categories: Category[];
  defaultCategoryId?: string;
  defaultSubCategoryId?: string;
  onSave: (data: {
    shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>;
    categoryId: string;
    subcategoryId: string | null;
  }) => void;
  onCancel: () => void;
}

export function ShortcutForm({
  initial,
  categories,
  defaultCategoryId,
  defaultSubCategoryId,
  onSave,
  onCancel,
}: ShortcutFormProps) {
  const [action, setAction] = useState(initial?.action ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [combos, setCombos] = useState<KeyCombo[]>(initial?.keys ?? [{ modifiers: [], key: '' }]);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? '');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(defaultSubCategoryId ?? null);

  const selectedCat = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (!selectedCat?.subcategories.find(s => s.id === subcategoryId)) {
      setSubcategoryId(null);
    }
  }, [categoryId, selectedCat, subcategoryId]);

  const addCombo = () => setCombos(prev => [...prev, { modifiers: [], key: '' }]);
  const removeCombo = (i: number) => setCombos(prev => prev.filter((_, idx) => idx !== i));
  const updateCombo = (i: number, combo: KeyCombo) =>
    setCombos(prev => prev.map((c, idx) => (idx === i ? combo : c)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim()) return;
    const validCombos = combos.filter(c => c.key);
    if (validCombos.length === 0) return;
    onSave({
      shortcut: {
        action: action.trim(),
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        keys: validCombos,
        tags: [],
      },
      categoryId,
      subcategoryId,
    });
  };

  return (
    <form className="shortcut-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">
          Catégorie
          <select
            className="form-select"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </label>

        {selectedCat && selectedCat.subcategories.length > 0 && (
          <label className="form-label">
            Sous-catégorie
            <select
              className="form-select"
              value={subcategoryId ?? ''}
              onChange={e => setSubcategoryId(e.target.value || null)}
            >
              <option value="">— Aucune —</option>
              {selectedCat.subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="form-label">
        Action *
        <input
          className="form-input"
          type="text"
          value={action}
          onChange={e => setAction(e.target.value)}
          placeholder="ex : Couper le clip"
          required
        />
      </label>

      <label className="form-label">
        Description (optionnel)
        <input
          className="form-input"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Courte description de l'action"
        />
      </label>

      <div className="form-label">
        Combinaison(s) de touches *
        {combos.map((combo, i) => (
          <div key={i} className="combo-row">
            <KeyRecorder
              value={combo.key ? combo : null}
              onChange={(c) => updateCombo(i, c)}
            />
            {combos.length > 1 && (
              <button
                type="button"
                className="btn-icon btn-danger-ghost"
                onClick={() => removeCombo(i)}
                title="Supprimer cette combinaison"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-ghost btn-sm" onClick={addCombo}>
          + Variante (mac/win)
        </button>
      </div>

      <label className="form-label">
        Note (optionnel)
        <textarea
          className="form-textarea"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Contexte, astuce…"
          rows={2}
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={!action.trim()}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
