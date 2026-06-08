import React, { useState } from 'react';
import type { Category, Shortcut, SubCategory } from '../../types/shortcuts';
import { KeyComboList } from './KeyCapDisplay';
import { ShortcutForm } from './ShortcutForm';

interface ShortcutListProps {
  category: Category;
  allCategories: Category[];
  softwareId: string;
  onAdd: (data: {
    shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>;
    categoryId: string;
    subcategoryId: string | null;
  }) => void;
  onEdit: (
    categoryId: string,
    subcategoryId: string | null,
    shortcutId: string,
    data: Partial<Omit<Shortcut, 'id' | 'createdAt'>>
  ) => void;
  onDelete: (categoryId: string, subcategoryId: string | null, shortcutId: string) => void;
}

export function ShortcutList({
  category,
  allCategories,
  onAdd,
  onEdit,
  onDelete,
}: ShortcutListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    shortcut: Shortcut;
    categoryId: string;
    subcategoryId: string | null;
  } | null>(null);

  const totalCount =
    category.shortcuts.length +
    category.subcategories.reduce((n, s) => n + s.shortcuts.length, 0);

  const handleSave = (data: {
    shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>;
    categoryId: string;
    subcategoryId: string | null;
  }) => {
    onAdd(data);
    setShowForm(false);
  };

  const handleEditSave = (data: {
    shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>;
    categoryId: string;
    subcategoryId: string | null;
  }) => {
    if (!editTarget) return;
    onEdit(data.categoryId, data.subcategoryId, editTarget.shortcut.id, data.shortcut);
    setEditTarget(null);
  };

  return (
    <div className="shortcut-list">
      <div className="shortcut-list-header">
        <h3 className="shortcut-list-title">
          {category.icon && <span>{category.icon} </span>}
          {category.name}
          <span className="shortcut-list-count">{totalCount}</span>
        </h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          + Raccourci
        </button>
      </div>

      {showForm && (
        <div className="shortcut-form-wrapper">
          <ShortcutForm
            categories={allCategories}
            defaultCategoryId={category.id}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editTarget && (
        <div className="shortcut-form-wrapper shortcut-form-wrapper--edit">
          <h4 className="form-edit-title">Modifier le raccourci</h4>
          <ShortcutForm
            initial={editTarget.shortcut}
            categories={allCategories}
            defaultCategoryId={editTarget.categoryId}
            defaultSubCategoryId={editTarget.subcategoryId ?? undefined}
            onSave={handleEditSave}
            onCancel={() => setEditTarget(null)}
          />
        </div>
      )}

      {/* Direct shortcuts (no subcategory) */}
      {category.shortcuts.length > 0 && (
        <ShortcutTable
          shortcuts={category.shortcuts}
          categoryId={category.id}
          subcategoryId={null}
          onEdit={(s) => setEditTarget({ shortcut: s, categoryId: category.id, subcategoryId: null })}
          onDelete={(id) => onDelete(category.id, null, id)}
        />
      )}

      {/* Subcategory sections */}
      {[...category.subcategories]
        .sort((a, b) => a.order - b.order)
        .map(sub => (
          <SubCategorySection
            key={sub.id}
            sub={sub}
            categoryId={category.id}
            allCategories={allCategories}
            onAdd={onAdd}
            onEdit={(s) => setEditTarget({ shortcut: s, categoryId: category.id, subcategoryId: sub.id })}
            onDelete={(id) => onDelete(category.id, sub.id, id)}
          />
        ))}

      {totalCount === 0 && !showForm && (
        <div className="shortcut-empty">
          <p>Aucun raccourci dans cette catégorie.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
            Ajouter le premier
          </button>
        </div>
      )}
    </div>
  );
}

function SubCategorySection({
  sub,
  categoryId,
  allCategories,
  onAdd,
  onEdit,
  onDelete,
}: {
  sub: SubCategory;
  categoryId: string;
  allCategories: Category[];
  onAdd: ShortcutListProps['onAdd'];
  onEdit: (s: Shortcut) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="subcategory-section">
      <div className="subcategory-header">
        <h4 className="subcategory-title">
          {sub.name}
          <span className="shortcut-list-count">{sub.shortcuts.length}</span>
        </h4>
        <button className="btn-ghost btn-sm" onClick={() => setShowForm(!showForm)}>
          + Raccourci
        </button>
      </div>

      {showForm && (
        <div className="shortcut-form-wrapper">
          <ShortcutForm
            categories={allCategories}
            defaultCategoryId={categoryId}
            defaultSubCategoryId={sub.id}
            onSave={(data) => { onAdd(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {sub.shortcuts.length > 0 && (
        <ShortcutTable
          shortcuts={sub.shortcuts}
          categoryId={categoryId}
          subcategoryId={sub.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

interface ShortcutTableProps {
  shortcuts: Shortcut[];
  categoryId: string;
  subcategoryId: string | null;
  onEdit: (shortcut: Shortcut) => void;
  onDelete: (id: string) => void;
}

function ShortcutTable({ shortcuts, onEdit, onDelete }: ShortcutTableProps) {
  return (
    <table className="shortcut-table">
      <tbody>
        {shortcuts.map(s => (
          <tr key={s.id} className="shortcut-row">
            <td className="shortcut-action">
              <span className="shortcut-action-name">{s.action}</span>
              {s.description && (
                <span className="shortcut-action-desc">{s.description}</span>
              )}
            </td>
            <td className="shortcut-keys">
              <KeyComboList combos={s.keys} size="sm" />
            </td>
            {s.note && (
              <td className="shortcut-note" title={s.note}>
                <span className="note-badge">💬</span>
              </td>
            )}
            <td className="shortcut-row-actions">
              <button
                className="btn-icon"
                onClick={() => onEdit(s)}
                title="Modifier"
              >✎</button>
              <button
                className="btn-icon btn-danger-ghost"
                onClick={() => onDelete(s.id)}
                title="Supprimer"
              >✕</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
