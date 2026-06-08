/**
 * Parsers for importing keyboard shortcuts from various software export formats.
 *
 * Supported formats:
 *  - DaVinci Resolve  .keyb  (XML)
 *  - VS Code          keybindings.json  (JSON array)
 *  - Photoshop        .kys  (XML – partial, best-effort)
 *  - Generic CSV      action,keys,category,note
 */

import type { Category, KeyCombo, Modifier, Shortcut, Software } from '../types/shortcuts';
import { parseKeyComboString } from './shortcutStore';

export interface ImportResult {
  software: Omit<Software, 'id' | 'createdAt' | 'updatedAt'>;
  warnings: string[];
}

// ─── DaVinci Resolve .keyb (XML) ─────────────────────────────────────────────

export function parseDaVinciKeyb(xmlText: string, softwareName = 'DaVinci Resolve'): ImportResult {
  const warnings: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    warnings.push('Fichier XML invalide — impossible de parser.');
    return {
      software: { name: softwareName, slug: 'davinci-resolve', icon: '🎬', categories: [] },
      warnings,
    };
  }

  const categoriesMap = new Map<string, Category>();

  // DaVinci uses <Context name="..."> containing <Binding ActionName="..." Keys="..." />
  // or <Shortcut ActionName="..." Keys="..." Modifiers="..." />
  const contexts = doc.querySelectorAll('Context, Page');
  contexts.forEach(ctx => {
    const ctxName = ctx.getAttribute('name') || ctx.getAttribute('id') || 'Général';
    const items = ctx.querySelectorAll('Binding, Shortcut');
    if (items.length === 0) return;

    if (!categoriesMap.has(ctxName)) {
      categoriesMap.set(ctxName, {
        id: ctxName,
        name: ctxName,
        order: categoriesMap.size,
        color: undefined,
        icon: undefined,
        shortcuts: [],
        subcategories: [],
      });
    }

    const cat = categoriesMap.get(ctxName)!;

    items.forEach(item => {
      const action =
        item.getAttribute('ActionName') ||
        item.getAttribute('action') ||
        item.getAttribute('name') ||
        '';
      if (!action) return;

      // Keys may be like "Ctrl+Z" or just "Z", Modifiers may be separate attr
      const keysAttr = item.getAttribute('Keys') || item.getAttribute('keys') || '';
      const modifiersAttr = item.getAttribute('Modifiers') || item.getAttribute('modifiers') || '';

      const combo = buildDaVinciCombo(keysAttr, modifiersAttr);
      if (!combo) return;

      const shortcut: Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'> = {
        action,
        keys: [combo],
      };
      cat.shortcuts.push(shortcut as Shortcut);
    });
  });

  // Fallback: flat <Binding> at root level
  if (categoriesMap.size === 0) {
    const allBindings = doc.querySelectorAll('Binding, Shortcut');
    if (allBindings.length > 0) {
      const cat: Category = {
        id: 'general',
        name: 'Général',
        order: 0,
        shortcuts: [],
        subcategories: [],
      };
      allBindings.forEach(item => {
        const action = item.getAttribute('ActionName') || item.getAttribute('action') || '';
        const keysAttr = item.getAttribute('Keys') || '';
        const modifiersAttr = item.getAttribute('Modifiers') || '';
        const combo = buildDaVinciCombo(keysAttr, modifiersAttr);
        if (action && combo) {
          cat.shortcuts.push({ action, keys: [combo] } as Shortcut);
        }
      });
      if (cat.shortcuts.length > 0) categoriesMap.set('general', cat);
    }
  }

  if (categoriesMap.size === 0) {
    warnings.push('Aucun raccourci trouvé dans ce fichier. Le format peut différer de ce qui est attendu.');
  }

  return {
    software: {
      name: softwareName,
      slug: 'davinci-resolve',
      icon: '🎬',
      platform: 'all',
      categories: Array.from(categoriesMap.values()),
    },
    warnings,
  };
}

function buildDaVinciCombo(keysAttr: string, modifiersAttr: string): KeyCombo | null {
  const key = keysAttr.trim();
  if (!key) return null;

  // If keys already contains "+" it's a full combo string
  if (key.includes('+')) {
    return parseKeyComboString(key);
  }

  const modParts = modifiersAttr
    .split(/[+,|]/)
    .map(m => m.trim())
    .filter(Boolean)
    .map(normalizeDaVinciModifier)
    .filter(Boolean) as Modifier[];

  return { modifiers: modParts, key };
}

function normalizeDaVinciModifier(m: string): Modifier | null {
  const map: Record<string, Modifier> = {
    ctrl: 'Ctrl',
    control: 'Ctrl',
    shift: 'Shift',
    alt: 'Alt',
    option: 'Alt',
    meta: 'Meta',
    cmd: 'Cmd',
    command: 'Cmd',
    win: 'Win',
    windows: 'Win',
  };
  return map[m.toLowerCase()] ?? null;
}

// ─── VS Code keybindings.json ─────────────────────────────────────────────────

interface VSCodeBinding {
  key: string;
  command: string;
  when?: string;
}

export function parseVSCodeKeybindings(json: string): ImportResult {
  const warnings: string[] = [];
  let bindings: VSCodeBinding[];
  try {
    bindings = JSON.parse(json) as VSCodeBinding[];
    if (!Array.isArray(bindings)) throw new Error('not array');
  } catch {
    warnings.push('Fichier JSON invalide.');
    return {
      software: { name: 'VS Code', slug: 'vscode', icon: '💻', categories: [] },
      warnings,
    };
  }

  // Group by inferred category from command namespace
  const groups = new Map<string, Shortcut[]>();

  bindings.forEach(b => {
    if (!b.key || !b.command) return;
    const cmd = b.command;
    const ns = cmd.split('.')[0];
    const label = categoryLabelForVSCode(ns);

    if (!groups.has(label)) groups.set(label, []);

    const combo = parseVSCodeKeyStr(b.key);
    if (!combo) return;

    groups.get(label)!.push({
      id: '',
      action: cmd,
      description: b.when ? `when: ${b.when}` : undefined,
      keys: [combo],
      createdAt: '',
      updatedAt: '',
    });
  });

  const categories: Category[] = Array.from(groups.entries()).map(([name, shortcuts], i) => ({
    id: name,
    name,
    order: i,
    shortcuts,
    subcategories: [],
  }));

  return {
    software: { name: 'VS Code', slug: 'vscode', icon: '💻', platform: 'all', categories },
    warnings,
  };
}

function parseVSCodeKeyStr(str: string): KeyCombo | null {
  // VS Code format: "ctrl+shift+p", "cmd+k cmd+s" (chords – take first)
  const chord = str.split(' ')[0];
  return parseKeyComboString(
    chord
      .replace(/\bmeta\b/gi, 'Cmd')
      .replace(/\bctrl\b/gi, 'Ctrl')
      .replace(/\bshift\b/gi, 'Shift')
      .replace(/\balt\b/gi, 'Alt')
  );
}

function categoryLabelForVSCode(ns: string): string {
  const map: Record<string, string> = {
    editor: 'Édition',
    workbench: 'Interface',
    explorer: 'Explorateur',
    search: 'Recherche',
    debug: 'Débogage',
    terminal: 'Terminal',
    git: 'Git',
    extension: 'Extensions',
  };
  return map[ns.toLowerCase()] ?? ns;
}

// ─── Generic CSV ──────────────────────────────────────────────────────────────
// Expected header: action,keys,category,subcategory,note

export function parseGenericCSV(csv: string, softwareName: string): ImportResult {
  const warnings: string[] = [];
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    warnings.push('CSV vide ou header manquant.');
    return {
      software: { name: softwareName, slug: slugify(softwareName), categories: [] },
      warnings,
    };
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const colIndex = (name: string) => header.indexOf(name);

  const iAction = colIndex('action');
  const iKeys = colIndex('keys');
  const iCategory = colIndex('category');
  const iSub = colIndex('subcategory');
  const iNote = colIndex('note');

  if (iAction === -1 || iKeys === -1) {
    warnings.push('Colonnes "action" et "keys" requises dans le CSV.');
    return {
      software: { name: softwareName, slug: slugify(softwareName), categories: [] },
      warnings,
    };
  }

  const catMap = new Map<string, Map<string, Shortcut[]>>();

  lines.slice(1).forEach((line, i) => {
    const cols = splitCSVLine(line);
    const action = cols[iAction]?.trim();
    const keysRaw = cols[iKeys]?.trim();
    if (!action || !keysRaw) { warnings.push(`Ligne ${i + 2} ignorée (action ou keys vide).`); return; }

    const catName = (iCategory >= 0 && cols[iCategory]?.trim()) || 'Général';
    const subName = (iSub >= 0 && cols[iSub]?.trim()) || '';
    const note = (iNote >= 0 && cols[iNote]?.trim()) || undefined;

    if (!catMap.has(catName)) catMap.set(catName, new Map());
    const subMap = catMap.get(catName)!;
    if (!subMap.has(subName)) subMap.set(subName, []);

    const combo = parseKeyComboString(keysRaw);
    subMap.get(subName)!.push({
      id: '',
      action,
      keys: [combo],
      note,
      createdAt: '',
      updatedAt: '',
    });
  });

  const categories: Category[] = Array.from(catMap.entries()).map(([catName, subMap], i) => {
    const directShortcuts = subMap.get('') ?? [];
    const subcategories = Array.from(subMap.entries())
      .filter(([k]) => k !== '')
      .map(([subName, shortcuts], j) => ({
        id: subName,
        name: subName,
        order: j,
        shortcuts,
      }));
    return {
      id: catName,
      name: catName,
      order: i,
      shortcuts: directShortcuts,
      subcategories,
    };
  });

  return {
    software: { name: softwareName, slug: slugify(softwareName), categories },
    warnings,
  };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── Photoshop .kys (XML) ────────────────────────────────────────────────────

export function parsePhotoshopKys(xmlText: string): ImportResult {
  // Photoshop .kys is a proprietary XML format.
  // Best-effort parser: look for <key> and <string> pairs.
  const warnings: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    warnings.push('Format .kys non lisible. Essayez l\'export CSV ou saisie manuelle.');
    return {
      software: { name: 'Photoshop', slug: 'photoshop', icon: '🖼️', categories: [] },
      warnings,
    };
  }

  // Photoshop kys is a plist-like XML; try to extract <key>/<string> pairs
  const category: Category = {
    id: 'imported',
    name: 'Importé',
    order: 0,
    shortcuts: [],
    subcategories: [],
  };

  const keys = doc.querySelectorAll('key');
  keys.forEach(keyEl => {
    const sibling = keyEl.nextElementSibling;
    if (!sibling) return;
    const action = keyEl.textContent?.trim() ?? '';
    const value = sibling.textContent?.trim() ?? '';
    if (!action || !value) return;
    const combo = parseKeyComboString(value);
    if (combo.key) {
      category.shortcuts.push({
        id: '',
        action,
        keys: [combo],
        createdAt: '',
        updatedAt: '',
      });
    }
  });

  warnings.push('L\'import Photoshop est partiel. Vérifiez les raccourcis importés.');

  return {
    software: {
      name: 'Photoshop',
      slug: 'photoshop',
      icon: '🖼️',
      categories: category.shortcuts.length > 0 ? [category] : [],
    },
    warnings,
  };
}

// ─── Auto-detect format ───────────────────────────────────────────────────────

export function autoImport(content: string, filename: string, softwareName?: string): ImportResult {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'keyb') return parseDaVinciKeyb(content, softwareName || 'DaVinci Resolve');
  if (ext === 'kys') return parsePhotoshopKys(content);
  if (ext === 'json') return parseVSCodeKeybindings(content);
  if (ext === 'csv') return parseGenericCSV(content, softwareName || filename.replace(/\.\w+$/, ''));

  // Sniff content
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return parseVSCodeKeybindings(content);
  }
  if (content.includes('<KeyboardShortcuts') || content.includes('<Context') || content.includes('<Binding')) {
    return parseDaVinciKeyb(content, softwareName || 'DaVinci Resolve');
  }
  if (content.includes('<?xml') || content.includes('<plist')) {
    return parsePhotoshopKys(content);
  }

  // Try CSV as last resort
  return parseGenericCSV(content, softwareName || 'Importé');
}
