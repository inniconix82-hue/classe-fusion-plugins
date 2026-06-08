import type {
  ShortcutDB,
  Software,
  Category,
  SubCategory,
  Shortcut,
  KeyCombo,
  SearchResult,
} from '../types/shortcuts';

const STORAGE_KEY = 'shortcut-manager-db';
const DB_VERSION = 1;

function now(): string {
  return new Date().toISOString();
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

function emptyDB(): ShortcutDB {
  return { softwares: [], version: DB_VERSION, updatedAt: now() };
}

export function loadDB(): ShortcutDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as ShortcutDB;
    return parsed;
  } catch {
    return emptyDB();
  }
}

export function saveDB(db: ShortcutDB): void {
  db.updatedAt = now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ─── Software ────────────────────────────────────────────────────────────────

export function addSoftware(
  db: ShortcutDB,
  data: Omit<Software, 'id' | 'categories' | 'createdAt' | 'updatedAt'>
): ShortcutDB {
  const sw: Software = {
    ...data,
    id: generateId(),
    categories: [],
    createdAt: now(),
    updatedAt: now(),
  };
  return { ...db, softwares: [...db.softwares, sw] };
}

export function updateSoftware(
  db: ShortcutDB,
  id: string,
  data: Partial<Pick<Software, 'name' | 'slug' | 'icon' | 'version' | 'platform'>>
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw =>
      sw.id === id ? { ...sw, ...data, updatedAt: now() } : sw
    ),
  };
}

export function deleteSoftware(db: ShortcutDB, id: string): ShortcutDB {
  return { ...db, softwares: db.softwares.filter(sw => sw.id !== id) };
}

// ─── Category ────────────────────────────────────────────────────────────────

export function addCategory(
  db: ShortcutDB,
  softwareId: string,
  data: Omit<Category, 'id' | 'shortcuts' | 'subcategories' | 'order'>
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      const cat: Category = {
        ...data,
        id: generateId(),
        order: sw.categories.length,
        shortcuts: [],
        subcategories: [],
      };
      return { ...sw, categories: [...sw.categories, cat], updatedAt: now() };
    }),
  };
}

export function updateCategory(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon'>>
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat =>
          cat.id === categoryId ? { ...cat, ...data } : cat
        ),
      };
    }),
  };
}

export function deleteCategory(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.filter(c => c.id !== categoryId),
      };
    }),
  };
}

export function reorderCategories(
  db: ShortcutDB,
  softwareId: string,
  orderedIds: string[]
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      const map = new Map(sw.categories.map(c => [c.id, c]));
      const reordered = orderedIds
        .map((id, idx) => {
          const c = map.get(id);
          return c ? { ...c, order: idx } : null;
        })
        .filter(Boolean) as Category[];
      return { ...sw, categories: reordered, updatedAt: now() };
    }),
  };
}

// ─── SubCategory ─────────────────────────────────────────────────────────────

export function addSubCategory(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  name: string
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          const sub: SubCategory = {
            id: generateId(),
            name,
            order: cat.subcategories.length,
            shortcuts: [],
          };
          return { ...cat, subcategories: [...cat.subcategories, sub] };
        }),
      };
    }),
  };
}

export function deleteSubCategory(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  subId: string
): ShortcutDB {
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            subcategories: cat.subcategories.filter(s => s.id !== subId),
          };
        }),
      };
    }),
  };
}

// ─── Shortcut ─────────────────────────────────────────────────────────────────

export function addShortcut(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  subcategoryId: string | null,
  data: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>
): ShortcutDB {
  const shortcut: Shortcut = {
    ...data,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  };
  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          if (!subcategoryId) {
            return { ...cat, shortcuts: [...cat.shortcuts, shortcut] };
          }
          return {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subcategoryId
                ? { ...sub, shortcuts: [...sub.shortcuts, shortcut] }
                : sub
            ),
          };
        }),
      };
    }),
  };
}

export function updateShortcut(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  subcategoryId: string | null,
  shortcutId: string,
  data: Partial<Omit<Shortcut, 'id' | 'createdAt'>>
): ShortcutDB {
  const patchShortcuts = (list: Shortcut[]) =>
    list.map(s =>
      s.id === shortcutId ? { ...s, ...data, updatedAt: now() } : s
    );

  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          if (!subcategoryId) {
            return { ...cat, shortcuts: patchShortcuts(cat.shortcuts) };
          }
          return {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subcategoryId
                ? { ...sub, shortcuts: patchShortcuts(sub.shortcuts) }
                : sub
            ),
          };
        }),
      };
    }),
  };
}

export function deleteShortcut(
  db: ShortcutDB,
  softwareId: string,
  categoryId: string,
  subcategoryId: string | null,
  shortcutId: string
): ShortcutDB {
  const removeFrom = (list: Shortcut[]) => list.filter(s => s.id !== shortcutId);

  return {
    ...db,
    softwares: db.softwares.map(sw => {
      if (sw.id !== softwareId) return sw;
      return {
        ...sw,
        updatedAt: now(),
        categories: sw.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          if (!subcategoryId) {
            return { ...cat, shortcuts: removeFrom(cat.shortcuts) };
          }
          return {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subcategoryId
                ? { ...sub, shortcuts: removeFrom(sub.shortcuts) }
                : sub
            ),
          };
        }),
      };
    }),
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function searchShortcuts(db: ShortcutDB, query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const sw of db.softwares) {
    for (const cat of sw.categories) {
      for (const shortcut of cat.shortcuts) {
        if (matchesShortcut(shortcut, q)) {
          results.push({ software: sw, category: cat, shortcut });
        }
      }
      for (const sub of cat.subcategories) {
        for (const shortcut of sub.shortcuts) {
          if (matchesShortcut(shortcut, q)) {
            results.push({ software: sw, category: cat, subcategory: sub, shortcut });
          }
        }
      }
    }
  }
  return results;
}

function matchesShortcut(shortcut: Shortcut, q: string): boolean {
  if (shortcut.action.toLowerCase().includes(q)) return true;
  if (shortcut.description?.toLowerCase().includes(q)) return true;
  if (shortcut.note?.toLowerCase().includes(q)) return true;
  for (const combo of shortcut.keys) {
    const combo_str = [...combo.modifiers, combo.key].join('+').toLowerCase();
    if (combo_str.includes(q)) return true;
  }
  return false;
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export function exportDB(db: ShortcutDB): string {
  return JSON.stringify(db, null, 2);
}

export function importDB(json: string): ShortcutDB | null {
  try {
    const parsed = JSON.parse(json) as ShortcutDB;
    if (!Array.isArray(parsed.softwares)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Bulk import (from file parsers) ─────────────────────────────────────────

export function mergeImportedSoftware(
  db: ShortcutDB,
  sw: Omit<Software, 'id' | 'createdAt' | 'updatedAt'>
): ShortcutDB {
  const withIds = assignIds(sw);
  const existing = db.softwares.find(s => s.slug === sw.slug);
  if (existing) {
    return {
      ...db,
      softwares: db.softwares.map(s =>
        s.slug === sw.slug
          ? { ...s, categories: [...s.categories, ...withIds.categories], updatedAt: now() }
          : s
      ),
    };
  }
  return { ...db, softwares: [...db.softwares, { ...withIds, id: generateId(), createdAt: now(), updatedAt: now() }] };
}

function assignIds(sw: Omit<Software, 'id' | 'createdAt' | 'updatedAt'>): Software {
  return {
    ...sw,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
    categories: sw.categories.map(cat => ({
      ...cat,
      id: generateId(),
      shortcuts: cat.shortcuts.map(s => ({ ...s, id: generateId(), createdAt: now(), updatedAt: now() })),
      subcategories: cat.subcategories.map(sub => ({
        ...sub,
        id: generateId(),
        shortcuts: sub.shortcuts.map(s => ({ ...s, id: generateId(), createdAt: now(), updatedAt: now() })),
      })),
    })),
  };
}

// ─── Key combo helpers ────────────────────────────────────────────────────────

export function formatKeyCombo(combo: KeyCombo): string {
  return [...combo.modifiers, combo.key].join('+');
}

export function parseKeyComboString(str: string): KeyCombo {
  const modifiers: string[] = ['Ctrl', 'Cmd', 'Alt', 'Shift', 'Win', 'Meta', 'Fn'];
  const parts = str.split('+').map(p => p.trim()).filter(Boolean);
  const mods: string[] = [];
  const keys: string[] = [];
  for (const p of parts) {
    if (modifiers.some(m => m.toLowerCase() === p.toLowerCase())) {
      mods.push(modifiers.find(m => m.toLowerCase() === p.toLowerCase())!);
    } else {
      keys.push(p);
    }
  }
  return { modifiers: mods as KeyCombo['modifiers'], key: keys.join('+') || '' };
}
