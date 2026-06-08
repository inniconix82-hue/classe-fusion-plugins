export type Modifier = 'Ctrl' | 'Cmd' | 'Alt' | 'Shift' | 'Win' | 'Meta' | 'Fn';

export type Platform = 'all' | 'mac' | 'windows';

export interface KeyCombo {
  modifiers: Modifier[];
  key: string;
  platform?: Platform;
}

export interface Shortcut {
  id: string;
  action: string;
  description?: string;
  keys: KeyCombo[];
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  order: number;
  shortcuts: Shortcut[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
  color?: string;
  icon?: string;
  shortcuts: Shortcut[];
  subcategories: SubCategory[];
}

export interface Software {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  version?: string;
  platform?: Platform;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface ShortcutDB {
  softwares: Software[];
  version: number;
  updatedAt: string;
}

export interface SearchResult {
  software: Software;
  category: Category;
  subcategory?: SubCategory;
  shortcut: Shortcut;
}

export const PRESET_SOFTWARES: Pick<Software, 'name' | 'slug' | 'icon'>[] = [
  { name: 'DaVinci Resolve', slug: 'davinci-resolve', icon: '🎬' },
  { name: 'Photoshop', slug: 'photoshop', icon: '🖼️' },
  { name: 'Illustrator', slug: 'illustrator', icon: '✏️' },
  { name: 'After Effects', slug: 'after-effects', icon: '🎞️' },
  { name: 'Premiere Pro', slug: 'premiere-pro', icon: '🎥' },
  { name: 'Final Cut Pro', slug: 'final-cut-pro', icon: '✂️' },
  { name: 'VS Code', slug: 'vscode', icon: '💻' },
  { name: 'Excel', slug: 'excel', icon: '📊' },
  { name: 'Word', slug: 'word', icon: '📄' },
  { name: 'Figma', slug: 'figma', icon: '🎨' },
  { name: 'Blender', slug: 'blender', icon: '🧊' },
  { name: 'Ableton Live', slug: 'ableton', icon: '🎵' },
];

export const PRESET_CATEGORIES: Record<string, string[]> = {
  'davinci-resolve': ['Timeline', 'Media Pool', 'Color', 'Fusion', 'Fairlight', 'Cut', 'Navigation', 'Playback', 'Effets'],
  'photoshop': ['Sélection', 'Calques', 'Masques', 'Filtres', 'Navigation', 'Peinture', 'Transformations', 'Vue'],
  'vscode': ['Édition', 'Navigation', 'Recherche', 'Débogage', 'Panneau', 'Terminal', 'Git'],
  'excel': ['Cellules', 'Formules', 'Navigation', 'Mise en forme', 'Sélection', 'Classeur', 'Vue'],
  'figma': ['Sélection', 'Formes', 'Texte', 'Calques', 'Composants', 'Vue', 'Export'],
};

export const KEY_DISPLAY_MAP: Record<string, string> = {
  ' ': 'Space',
  'arrowup': '↑',
  'arrowdown': '↓',
  'arrowleft': '←',
  'arrowright': '→',
  'backspace': '⌫',
  'delete': 'Del',
  'enter': '↵',
  'escape': 'Esc',
  'tab': 'Tab',
  'home': 'Home',
  'end': 'End',
  'pageup': 'PgUp',
  'pagedown': 'PgDn',
  'insert': 'Ins',
  'capslock': 'Caps',
  'numlock': 'Num',
  'scrolllock': 'Scrl',
  'printscreen': 'PrtSc',
  'pause': 'Pause',
};
