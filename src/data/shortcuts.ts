export interface Shortcut {
  id: string
  label: string
  keys: string
  description: string
}

export interface NodeShortcut {
  nodeLabel: string
  nodeCategory: string
  nodeColor: string
  nodeType: string
  keys: string // empty = not assigned
}

export const defaultShortcuts: Shortcut[] = [
  // Fichier
  { id: 'save',        label: 'Sauvegarder',      keys: 'Ctrl+S',         description: 'Sauvegarder le projet' },
  { id: 'load',        label: 'Ouvrir',            keys: 'Ctrl+O',         description: 'Ouvrir un projet' },
  { id: 'new',         label: 'Nouveau',            keys: 'Ctrl+N',         description: 'Nouveau projet vide' },
  // Édition
  { id: 'undo',        label: 'Annuler',            keys: 'Ctrl+Z',         description: 'Annuler la dernière action' },
  { id: 'redo',        label: 'Refaire',            keys: 'Ctrl+Y',         description: 'Refaire l\'action annulée' },
  { id: 'selectall',   label: 'Tout sélectionner', keys: 'Ctrl+A',         description: 'Sélectionner tous les nodes' },
  { id: 'copy',        label: 'Copier',             keys: 'Ctrl+C',         description: 'Copier les nodes sélectionnés' },
  { id: 'paste',       label: 'Coller',             keys: 'Ctrl+V',         description: 'Coller les nodes copiés' },
  { id: 'duplicate',   label: 'Dupliquer',          keys: 'Ctrl+Shift+D',   description: 'Dupliquer la sélection' },
  { id: 'disconnect',  label: 'Déconnecter',        keys: 'Ctrl+Shift+X',   description: 'Supprimer les connexions des nodes sélectionnés' },
  { id: 'extract',     label: 'Extraire (pont)',    keys: 'Ctrl+Alt+X',     description: 'Extraire le node du graphe en pontant ses voisins (A→B→C devient A→C)' },
  // Vue & Layout
  { id: 'layout',      label: 'Auto Layout',        keys: 'Ctrl+L',         description: 'Réorganiser les nodes' },
  { id: 'direction',   label: 'Changer direction',  keys: 'Ctrl+D',         description: 'Basculer vertical / horizontal' },
  { id: 'fitview',     label: 'Zoom adapté',        keys: 'Ctrl+F',         description: 'Adapter le zoom au contenu' },
  { id: 'minimap',     label: 'Minimap',            keys: 'Ctrl+M',         description: 'Afficher / masquer la minimap' },
  { id: 'addunderlay', label: 'Zone de groupe',     keys: 'Ctrl+G',         description: 'Ajouter une zone de regroupement' },
  // Panneaux
  { id: 'ollama',      label: 'Panneau IA',         keys: 'Ctrl+I',         description: 'Ouvrir / fermer le panneau Ollama' },
  { id: 'editor',      label: 'Éditeur de texte',   keys: 'Ctrl+E',         description: 'Ouvrir / fermer l\'éditeur de document' },
  { id: 'quicksearch', label: 'Recherche rapide',   keys: 'Shift+Space',    description: 'Ouvrir la recherche rapide de nodes' },
  { id: 'templates',   label: 'Templates',          keys: 'Ctrl+T',         description: 'Ouvrir les templates' },
  { id: 'categories',  label: 'Mes catégories',     keys: 'Ctrl+Shift+C',   description: 'Gérer les catégories personnalisées' },
  { id: 'shortcuts',   label: 'Raccourcis',         keys: 'Ctrl+K',         description: 'Afficher la liste des raccourcis' },
  { id: 'help',        label: 'Aide',               keys: 'F1',             description: 'Ouvrir l\'aide' },
  // Export
  { id: 'exportpng',   label: 'Export PNG',         keys: 'Ctrl+Shift+P',   description: 'Exporter en image PNG' },
  { id: 'exportpdf',   label: 'Export PDF',         keys: 'Ctrl+Shift+E',   description: 'Exporter en PDF' },
]

const STORAGE_KEY = 'nodeorg-shortcuts'

export function loadShortcuts(): Shortcut[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: Shortcut[] = JSON.parse(stored)
      // Merge with defaults to pick up any new shortcuts
      return defaultShortcuts.map((def) => {
        const saved = parsed.find((s) => s.id === def.id)
        return saved ? { ...def, keys: saved.keys } : def
      })
    }
  } catch {}
  return [...defaultShortcuts]
}

export function saveShortcuts(shortcuts: Shortcut[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
}

export function parseKeys(keysStr: string): { ctrl: boolean; shift: boolean; alt: boolean; key: string } {
  const parts = keysStr.split('+').map((p) => p.trim().toLowerCase())
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts.filter((p) => !['ctrl', 'shift', 'alt'].includes(p))[0] || '',
  }
}

export function matchesShortcut(e: KeyboardEvent, keysStr: string): boolean {
  const parsed = parseKeys(keysStr)
  const pressedKey = e.key === ' ' ? 'space' : e.key.toLowerCase()
  const ctrlPressed = e.ctrlKey || e.metaKey
  return (
    ctrlPressed === parsed.ctrl &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt &&
    pressedKey === parsed.key
  )
}

const NODE_SHORTCUTS_KEY = 'nodeorg-node-shortcuts'

export function loadNodeShortcuts(): NodeShortcut[] {
  try {
    const stored = localStorage.getItem(NODE_SHORTCUTS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function saveNodeShortcuts(shortcuts: NodeShortcut[]) {
  localStorage.setItem(NODE_SHORTCUTS_KEY, JSON.stringify(shortcuts))
}

export function formatKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  if (e.ctrlKey || e.metaKey) parts.push(isMac ? 'Cmd' : 'Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  const key = e.key
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    parts.push(key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key)
  }
  return parts.join('+')
}
