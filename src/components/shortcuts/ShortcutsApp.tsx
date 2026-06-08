import React, { useState, useEffect, useCallback } from 'react';
import type { ShortcutDB, Software, Shortcut } from '../../types/shortcuts';
import { PRESET_CATEGORIES } from '../../types/shortcuts';
import {
  loadDB,
  saveDB,
  addSoftware,
  updateSoftware,
  deleteSoftware,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  addSubCategory,
  deleteSubCategory,
  addShortcut,
  updateShortcut,
  deleteShortcut,
  mergeImportedSoftware,
  generateId,
} from '../../data/shortcutStore';
import { SoftwarePanel } from './SoftwarePanel';
import { CategoryManager } from './CategoryManager';
import { ShortcutList } from './ShortcutList';
import { SearchPanel } from './SearchPanel';
import { ImportWizard } from './ImportWizard';
import { PDFGenerator } from './PDFGenerator';
import type { ImportResult } from '../../data/shortcutImporters';

type Modal = 'none' | 'import' | 'pdf' | 'search';

export function ShortcutsApp() {
  const [db, setDb] = useState<ShortcutDB>(() => loadDB());
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string | null>(
    () => loadDB().softwares[0]?.id ?? null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [activeAppSlug, setActiveAppSlug] = useState<string | null>(null);

  // Persist on every change
  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Listen for active app from Electron
  useEffect(() => {
    const api = (window as typeof window & {
      electronAPI?: { onActiveApp?: (cb: (slug: string) => void) => void }
    }).electronAPI;
    api?.onActiveApp?.((slug: string) => setActiveAppSlug(slug));
  }, []);

  // Global keyboard shortcuts for this view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setModal(m => m === 'search' ? 'none' : 'search');
      }
      if (e.key === 'Escape' && modal !== 'none') {
        setModal('none');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal]);

  const selectedSoftware = db.softwares.find(s => s.id === selectedSoftwareId) ?? null;
  const selectedCategory = selectedSoftware?.categories.find(c => c.id === selectedCategoryId) ?? null;

  // ─── Software handlers ──────────────────────────────────────────────────────

  const handleAddSoftware = useCallback((name: string, icon?: string, slug?: string) => {
    const sw = {
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      icon: icon ?? '📌',
    };
    const newDb = addSoftware(db, sw);
    const newSw = newDb.softwares[newDb.softwares.length - 1];

    // Auto-create preset categories
    let dbWithCats = newDb;
    const presetCats = PRESET_CATEGORIES[sw.slug ?? ''] ?? [];
    presetCats.forEach(catName => {
      dbWithCats = addCategory(dbWithCats, newSw.id, { name: catName });
    });

    setDb(dbWithCats);
    setSelectedSoftwareId(newSw.id);
    setSelectedCategoryId(null);
  }, [db]);

  const handleDeleteSoftware = useCallback((id: string) => {
    if (!confirm('Supprimer ce logiciel et tous ses raccourcis ?')) return;
    const newDb = deleteSoftware(db, id);
    setDb(newDb);
    if (selectedSoftwareId === id) {
      setSelectedSoftwareId(newDb.softwares[0]?.id ?? null);
      setSelectedCategoryId(null);
    }
  }, [db, selectedSoftwareId]);

  const handleRenameSoftware = useCallback((id: string, name: string) => {
    setDb(prev => updateSoftware(prev, id, { name }));
  }, []);

  // ─── Category handlers ──────────────────────────────────────────────────────

  const handleAddCategory = useCallback((name: string, icon?: string) => {
    if (!selectedSoftwareId) return;
    const newDb = addCategory(db, selectedSoftwareId, { name, icon });
    const sw = newDb.softwares.find(s => s.id === selectedSoftwareId)!;
    const newCat = sw.categories[sw.categories.length - 1];
    setDb(newDb);
    setSelectedCategoryId(newCat.id);
  }, [db, selectedSoftwareId]);

  const handleDeleteCategory = useCallback((id: string) => {
    if (!selectedSoftwareId) return;
    const cat = selectedSoftware?.categories.find(c => c.id === id);
    const total = (cat?.shortcuts.length ?? 0) + (cat?.subcategories.reduce((n, s) => n + s.shortcuts.length, 0) ?? 0);
    if (total > 0 && !confirm(`Supprimer cette catégorie et ses ${total} raccourcis ?`)) return;
    setDb(prev => deleteCategory(prev, selectedSoftwareId, id));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  }, [db, selectedSoftwareId, selectedCategoryId, selectedSoftware]);

  const handleRenameCategory = useCallback((id: string, name: string) => {
    if (!selectedSoftwareId) return;
    setDb(prev => updateCategory(prev, selectedSoftwareId, id, { name }));
  }, [selectedSoftwareId]);

  const handleReorderCategories = useCallback((orderedIds: string[]) => {
    if (!selectedSoftwareId) return;
    setDb(prev => reorderCategories(prev, selectedSoftwareId, orderedIds));
  }, [selectedSoftwareId]);

  const handleAddSubCategory = useCallback((categoryId: string, name: string) => {
    if (!selectedSoftwareId) return;
    setDb(prev => addSubCategory(prev, selectedSoftwareId, categoryId, name));
  }, [selectedSoftwareId]);

  const handleDeleteSubCategory = useCallback((categoryId: string, subId: string) => {
    if (!selectedSoftwareId) return;
    setDb(prev => deleteSubCategory(prev, selectedSoftwareId, categoryId, subId));
  }, [selectedSoftwareId]);

  // ─── Shortcut handlers ──────────────────────────────────────────────────────

  const handleAddShortcut = useCallback((data: {
    shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>;
    categoryId: string;
    subcategoryId: string | null;
  }) => {
    if (!selectedSoftwareId) return;
    setDb(prev => addShortcut(prev, selectedSoftwareId, data.categoryId, data.subcategoryId, data.shortcut));
  }, [selectedSoftwareId]);

  const handleEditShortcut = useCallback((
    categoryId: string,
    subcategoryId: string | null,
    shortcutId: string,
    data: Partial<Omit<Shortcut, 'id' | 'createdAt'>>
  ) => {
    if (!selectedSoftwareId) return;
    setDb(prev => updateShortcut(prev, selectedSoftwareId, categoryId, subcategoryId, shortcutId, data));
  }, [selectedSoftwareId]);

  const handleDeleteShortcut = useCallback((
    categoryId: string,
    subcategoryId: string | null,
    shortcutId: string
  ) => {
    if (!selectedSoftwareId) return;
    setDb(prev => deleteShortcut(prev, selectedSoftwareId, categoryId, subcategoryId, shortcutId));
  }, [selectedSoftwareId]);

  // ─── Import handler ─────────────────────────────────────────────────────────

  const handleImport = useCallback((result: ImportResult, softwareName: string) => {
    const swData = { ...result.software, name: softwareName };
    setDb(prev => mergeImportedSoftware(prev, swData));
    setModal('none');
    // Select the imported software
    setTimeout(() => {
      setDb(current => {
        const imported = current.softwares.find(s => s.slug === swData.slug);
        if (imported) setSelectedSoftwareId(imported.id);
        return current;
      });
    }, 100);
  }, []);

  // ─── Export handler ─────────────────────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(db, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shortcuts-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [db]);

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as ShortcutDB;
        if (parsed.softwares && confirm('Fusionner avec les données existantes ?')) {
          setDb(prev => ({
            ...prev,
            softwares: [
              ...prev.softwares,
              ...parsed.softwares.filter(s => !prev.softwares.find(e => e.slug === s.slug)),
            ],
          }));
        }
      } catch {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const totalShortcuts = db.softwares.reduce(
    (n, sw) => n + sw.categories.reduce(
      (m, c) => m + c.shortcuts.length + c.subcategories.reduce((s, sub) => s + sub.shortcuts.length, 0),
      0
    ),
    0
  );

  return (
    <div className="shortcuts-app">
      {/* Top bar */}
      <div className="shortcuts-topbar">
        <div className="shortcuts-topbar-left">
          <h1 className="shortcuts-title">⌨️ Raccourcis Clavier</h1>
          <span className="shortcuts-stats">{db.softwares.length} logiciels · {totalShortcuts} raccourcis</span>
        </div>
        <div className="shortcuts-topbar-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal('search')}
            title="Rechercher (Ctrl+F)"
          >
            🔍 Recherche
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal('import')}
            title="Importer depuis un fichier"
          >
            ⬆ Importer
          </button>
          {selectedSoftware && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setModal('pdf')}
              title="Exporter en PDF"
            >
              📄 PDF
            </button>
          )}
          <div className="dropdown">
            <button className="btn btn-ghost btn-sm">⋯</button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleExportJSON}>
                Sauvegarder (JSON)
              </button>
              <label className="dropdown-item">
                Restaurer (JSON)
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="shortcuts-layout">
        {/* Left: software list */}
        <aside className="shortcuts-sidebar-left">
          <SoftwarePanel
            softwares={db.softwares}
            selectedId={selectedSoftwareId}
            activeAppSlug={activeAppSlug}
            onSelect={id => { setSelectedSoftwareId(id); setSelectedCategoryId(null); }}
            onAdd={handleAddSoftware}
            onDelete={handleDeleteSoftware}
            onRename={handleRenameSoftware}
          />
        </aside>

        {/* Middle: categories */}
        {selectedSoftware && (
          <aside className="shortcuts-sidebar-mid">
            <CategoryManager
              software={selectedSoftware}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onRenameCategory={handleRenameCategory}
              onReorderCategories={handleReorderCategories}
              onAddSubCategory={handleAddSubCategory}
              onDeleteSubCategory={handleDeleteSubCategory}
            />
          </aside>
        )}

        {/* Right: shortcuts */}
        <main className="shortcuts-main">
          {selectedCategory && selectedSoftware ? (
            <ShortcutList
              category={selectedCategory}
              allCategories={selectedSoftware.categories}
              softwareId={selectedSoftware.id}
              onAdd={handleAddShortcut}
              onEdit={handleEditShortcut}
              onDelete={handleDeleteShortcut}
            />
          ) : selectedSoftware ? (
            <div className="shortcuts-welcome">
              <div className="shortcuts-welcome-icon">{selectedSoftware.icon ?? '📌'}</div>
              <h2>{selectedSoftware.name}</h2>
              {selectedSoftware.categories.length === 0 ? (
                <p>Commencez par créer une catégorie dans le panneau de gauche.</p>
              ) : (
                <p>Sélectionnez une catégorie pour voir et gérer les raccourcis.</p>
              )}
            </div>
          ) : (
            <div className="shortcuts-welcome">
              <div className="shortcuts-welcome-icon">⌨️</div>
              <h2>Gestionnaire de Raccourcis</h2>
              <p>Ajoutez un logiciel pour commencer à enregistrer vos raccourcis.</p>
              <button
                className="btn btn-primary"
                onClick={() => handleAddSoftware('DaVinci Resolve', '🎬', 'davinci-resolve')}
              >
                Commencer avec DaVinci Resolve
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {modal === 'search' && (
        <div className="modal-overlay" onClick={() => setModal('none')}>
          <div className="modal-panel modal-panel--search" onClick={e => e.stopPropagation()}>
            <SearchPanel
              db={db}
              onNavigate={(swId, catId) => {
                setSelectedSoftwareId(swId);
                setSelectedCategoryId(catId);
                setModal('none');
              }}
              onClose={() => setModal('none')}
            />
          </div>
        </div>
      )}

      {modal === 'import' && (
        <ImportWizard onImport={handleImport} onClose={() => setModal('none')} />
      )}

      {modal === 'pdf' && selectedSoftware && (
        <PDFGenerator
          software={selectedSoftware}
          selectedCategoryId={selectedCategoryId}
          onClose={() => setModal('pdf' === modal ? 'none' : modal)}
        />
      )}
    </div>
  );
}
