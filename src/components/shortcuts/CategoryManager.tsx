import React, { useState } from 'react';
import type { Category, Software } from '../../types/shortcuts';

interface CategoryManagerProps {
  software: Software;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onAddCategory: (name: string, icon?: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onReorderCategories: (orderedIds: string[]) => void;
  onAddSubCategory: (categoryId: string, name: string) => void;
  onDeleteSubCategory: (categoryId: string, subId: string) => void;
}

export function CategoryManager({
  software,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onReorderCategories,
  onAddSubCategory,
  onDeleteSubCategory,
}: CategoryManagerProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [subTarget, setSubTarget] = useState<string | null>(null);

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatIcon.trim() || undefined);
    setNewCatName('');
    setNewCatIcon('');
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) onRenameCategory(id, editName.trim());
    setEditingId(null);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    const sorted = [...software.categories].sort((a, b) => a.order - b.order);
    const ids = sorted.map(c => c.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(targetIdx, 0, moved);
    onReorderCategories(ids);
    setDragIdx(null);
  };

  const handleAddSub = (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    onAddSubCategory(catId, newSubName.trim());
    setNewSubName('');
    setSubTarget(null);
  };

  const sorted = [...software.categories].sort((a, b) => a.order - b.order);
  const selectedCat = software.categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="category-manager">
      <div className="category-list">
        {sorted.map((cat, idx) => (
          <div
            key={cat.id}
            className={`category-item ${selectedCategoryId === cat.id ? 'category-item--active' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={() => handleDrop(idx)}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span className="drag-handle" title="Déplacer">⠿</span>

            {editingId === cat.id ? (
              <input
                className="category-rename-input"
                value={editName}
                autoFocus
                onChange={e => setEditName(e.target.value)}
                onBlur={() => commitEdit(cat.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit(cat.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="category-name">
                {cat.icon && <span className="category-icon">{cat.icon}</span>}
                {cat.name}
                <span className="category-count">
                  {cat.shortcuts.length + cat.subcategories.reduce((n, s) => n + s.shortcuts.length, 0)}
                </span>
              </span>
            )}

            <div className="category-actions" onClick={e => e.stopPropagation()}>
              <button
                className="btn-icon"
                onClick={() => startEdit(cat)}
                title="Renommer"
              >✎</button>
              <button
                className="btn-icon"
                onClick={() => setSubTarget(subTarget === cat.id ? null : cat.id)}
                title="Sous-catégorie"
              >+</button>
              <button
                className="btn-icon btn-danger-ghost"
                onClick={() => onDeleteCategory(cat.id)}
                title="Supprimer"
              >✕</button>
            </div>

            {subTarget === cat.id && (
              <form
                className="subcategory-add-form"
                onSubmit={e => handleAddSub(e, cat.id)}
                onClick={e => e.stopPropagation()}
              >
                <input
                  className="form-input form-input--sm"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="Nom de la sous-catégorie"
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" type="submit">OK</button>
              </form>
            )}

            {cat.subcategories.length > 0 && selectedCategoryId === cat.id && (
              <div className="subcategory-list">
                {[...cat.subcategories]
                  .sort((a, b) => a.order - b.order)
                  .map(sub => (
                    <div key={sub.id} className="subcategory-item">
                      <span>{sub.name} <span className="category-count">{sub.shortcuts.length}</span></span>
                      <button
                        className="btn-icon btn-danger-ghost"
                        onClick={e => { e.stopPropagation(); onDeleteSubCategory(cat.id, sub.id); }}
                        title="Supprimer"
                      >✕</button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="category-add-form" onSubmit={handleAddCat}>
        <input
          className="form-input category-icon-input"
          type="text"
          value={newCatIcon}
          onChange={e => setNewCatIcon(e.target.value)}
          placeholder="🗂️"
          maxLength={2}
          title="Emoji (optionnel)"
        />
        <input
          className="form-input"
          type="text"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="Nouvelle catégorie…"
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={!newCatName.trim()}>
          +
        </button>
      </form>
    </div>
  );
}
