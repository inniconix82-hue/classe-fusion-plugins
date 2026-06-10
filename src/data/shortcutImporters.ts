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

export interface CSVInfo {
  delimiter: string;
  headers: string[];        // from first line
  sampleRows: string[][];   // up to 3 data rows
  hasHeader: boolean;       // true if first line looks like a header
}

export interface CSVColumnMapping {
  delimiter: string;
  actionCol: number;        // column index, -1 = not set
  keysCol: number;
  categoryCol: number;
  subcategoryCol: number;
  noteCol: number;
  hasHeader: boolean;
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

function splitCSVLineDelim(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (!inQuotes && line.startsWith(delimiter, i)) {
      result.push(current); current = '';
      i += delimiter.length - 1;
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function splitCSVLine(line: string): string[] {
  return splitCSVLineDelim(line, ',');
}

export function detectCSVInfo(content: string): CSVInfo {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { delimiter: ',', headers: [], sampleRows: [], hasHeader: false };

  // Detect best delimiter by counting occurrences in first line
  const candidates = [',', ';', '\t', '|'];
  let bestDelim = ',';
  let bestCount = 0;
  for (const d of candidates) {
    const count = (lines[0].match(new RegExp(d === '\t' ? '\t' : d.replace('|', '\\|'), 'g')) ?? []).length;
    if (count > bestCount) { bestCount = count; bestDelim = d; }
  }

  const split = (line: string) => splitCSVLineDelim(line, bestDelim);
  const firstRowCols = split(lines[0]);

  // Heuristic: first row is a header if no cell looks like a key combo
  const looksLikeData = firstRowCols.some(c => /^[A-Za-z0-9+]{1,3}$/.test(c.trim()) && c.trim().length <= 3);
  const hasHeader = !looksLikeData || firstRowCols.some(c => /^(action|key|raccourci|category|shortcut|name|command)/i.test(c.trim()));

  const dataStart = hasHeader ? 1 : 0;
  return {
    delimiter: bestDelim,
    headers: firstRowCols.map(h => h.trim()),
    sampleRows: lines.slice(dataStart, dataStart + 3).map(split),
    hasHeader,
  };
}

export function parseCSVWithMapping(csv: string, softwareName: string, mapping: CSVColumnMapping): ImportResult {
  const warnings: string[] = [];
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = mapping.hasHeader ? lines.slice(1) : lines;

  const catMap = new Map<string, Map<string, Shortcut[]>>();

  dataLines.forEach((line, i) => {
    const cols = splitCSVLineDelim(line, mapping.delimiter);
    const action = mapping.actionCol >= 0 ? cols[mapping.actionCol]?.trim() : undefined;
    const keysRaw = mapping.keysCol >= 0 ? cols[mapping.keysCol]?.trim() : undefined;
    if (!action || !keysRaw) { warnings.push(`Ligne ${i + (mapping.hasHeader ? 2 : 1)} ignorée (action ou clé vide).`); return; }

    const catName = (mapping.categoryCol >= 0 && cols[mapping.categoryCol]?.trim()) || 'Général';
    const subName = (mapping.subcategoryCol >= 0 && cols[mapping.subcategoryCol]?.trim()) || '';
    const note = (mapping.noteCol >= 0 && cols[mapping.noteCol]?.trim()) || undefined;

    if (!catMap.has(catName)) catMap.set(catName, new Map());
    const subMap = catMap.get(catName)!;
    if (!subMap.has(subName)) subMap.set(subName, []);

    const combo = parseKeyComboString(keysRaw);
    subMap.get(subName)!.push({ id: '', action, keys: [combo], note, createdAt: '', updatedAt: '' });
  });

  const categories: Category[] = Array.from(catMap.entries()).map(([catName, subMap], i) => {
    const directShortcuts = subMap.get('') ?? [];
    const subcategories = Array.from(subMap.entries())
      .filter(([k]) => k !== '')
      .map(([subName, shortcuts], j) => ({ id: subName, name: subName, order: j, shortcuts }));
    return { id: catName, name: catName, order: i, shortcuts: directShortcuts, subcategories };
  });

  return { software: { name: softwareName, slug: slugify(softwareName), categories }, warnings };
}

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

  // Auto-detect delimiter
  const info = detectCSVInfo(csv);
  const delimiter = info.delimiter;
  const split = (line: string) => splitCSVLineDelim(line, delimiter);
  const header = split(lines[0]).map(h => h.trim().toLowerCase());

  // Try multiple aliases for each field
  const actionAliases   = ['action', 'name', 'nom', 'description', 'command', 'commande', 'fonction', 'label', 'title'];
  const keysAliases     = ['keys', 'key', 'shortcut', 'raccourci', 'binding', 'touche', 'touches', 'combo', 'hotkey'];
  const categoryAliases = ['category', 'catégorie', 'categorie', 'cat', 'group', 'groupe', 'section', 'module'];
  const subAliases      = ['subcategory', 'sous-catégorie', 'sous-categorie', 'sub', 'subcat'];
  const noteAliases     = ['note', 'notes', 'comment', 'commentaire', 'description'];

  const findCol = (aliases: string[]) => {
    for (const a of aliases) { const i = header.indexOf(a); if (i !== -1) return i; }
    return -1;
  };

  const iAction   = findCol(actionAliases);
  const iKeys     = findCol(keysAliases);
  const iCategory = findCol(categoryAliases);
  const iSub      = findCol(subAliases);
  const iNote     = findCol(noteAliases);

  if (iAction === -1 || iKeys === -1) {
    warnings.push('Colonnes "action" et "keys" requises dans le CSV.');
    return { software: { name: softwareName, slug: slugify(softwareName), categories: [] }, warnings };
  }

  const catMap = new Map<string, Map<string, Shortcut[]>>();

  lines.slice(1).forEach((line, i) => {
    const cols = split(line);
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
    subMap.get(subName)!.push({ id: '', action, keys: [combo], note, createdAt: '', updatedAt: '' });
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

// ─── DaVinci Resolve Text Hotkey Format  (action := key | key) ───────────────

export function parseDaVinciHotkeyTxt(text: string, softwareName = 'DaVinci Resolve'): ImportResult {
  const warnings: string[] = [];
  const catMap = new Map<string, Shortcut[]>();

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || !line.includes(':=')) continue;

    const eqIdx = line.indexOf(':=');
    const actionRaw = line.slice(0, eqIdx).trim();
    const keysRaw = line.slice(eqIdx + 2).trim();
    if (!keysRaw) continue;

    const action = formatDaVinciHotkeyAction(actionRaw);
    const category = getDaVinciHotkeyCategory(actionRaw);

    if (!catMap.has(category)) catMap.set(category, []);

    const combos = keysRaw
      .split('|')
      .map(k => k.trim())
      .filter(Boolean)
      .map(k => parseKeyComboString(k))
      .filter(c => c.key);

    if (combos.length === 0) continue;

    catMap.get(category)!.push({
      id: '',
      action,
      keys: combos,
      createdAt: '',
      updatedAt: '',
    });
  }

  if (catMap.size === 0) {
    warnings.push('Aucun raccourci trouvé. Vérifiez que le fichier contient des lignes "action := touche".');
  }

  const categories: Category[] = Array.from(catMap.entries()).map(([name, shortcuts], i) => ({
    id: name,
    name,
    order: i,
    shortcuts,
    subcategories: [],
  }));

  return {
    software: { name: softwareName, slug: slugify(softwareName), icon: '⌨️', categories },
    warnings,
  };
}

function formatDaVinciHotkeyAction(raw: string): string {
  let name = raw;
  name = name.replace(/^FusionWidget\.fuHotkey_/, '');
  name = name.replace(/^FairlightTimeline\./, '');
  name = name.replace(/^MediaPool\.Context_/, '');
  name = name.replace(/^Viewer\.Context_/, '');
  name = name.replace(/\s*\{[^}]*\}/g, '');
  name = name.replace(/_/g, ' ');
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  name = name.replace(/\s+/g, ' ').trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getDaVinciHotkeyCategory(raw: string): string {
  if (raw.startsWith('FusionWidget.')) return 'Fusion';
  if (raw.startsWith('FairlightTimeline.') || raw.startsWith('fairlight')) return 'Fairlight';
  if (raw.startsWith('MediaPool.')) return 'Media Pool';
  if (raw.startsWith('Viewer.')) return 'Viewer';
  if (raw.startsWith('edit')) return 'Édition';
  if (raw.startsWith('view')) return 'Vue';
  if (raw.startsWith('control')) return 'Contrôle';
  if (raw.startsWith('mark')) return 'Marqueurs';
  if (raw.startsWith('clip')) return 'Clips';
  if (raw.startsWith('trim')) return 'Trim';
  if (raw.startsWith('session')) return 'Session';
  if (raw.startsWith('workspace')) return 'Espaces de travail';
  if (raw.startsWith('nodes')) return 'Nodes';
  if (raw.startsWith('file')) return 'Fichier';
  if (raw.startsWith('timeline')) return 'Timeline';
  if (raw.startsWith('resolve')) return 'Réglages';
  return 'Général';
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
  // DaVinci text hotkey format: lines contain ":="
  const firstLine = content.trim().split('\n')[0] ?? '';
  if (firstLine.includes(':=')) {
    return parseDaVinciHotkeyTxt(content, softwareName || filename.replace(/\.\w+$/, ''));
  }

  // Try CSV as last resort
  return parseGenericCSV(content, softwareName || 'Importé');
}
