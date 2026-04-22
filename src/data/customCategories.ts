import { type PresetNode, type PresetCategory } from './presets'

export interface CustomCategory extends PresetCategory {
  custom: true
}

const STORAGE_KEY = 'nodeorg-custom-categories'

let _customCategories: CustomCategory[] = []

export function loadCustomCategories(): CustomCategory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      _customCategories = JSON.parse(stored) as CustomCategory[]
    }
  } catch {
    _customCategories = []
  }
  return _customCategories
}

export function saveCustomCategories(cats: CustomCategory[]): void {
  _customCategories = cats
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
  } catch {}
}

export function getCustomCategories(): CustomCategory[] {
  return _customCategories
}

export function exportCategoriesToJSON(cats: CustomCategory[]): void {
  const blob = new Blob([JSON.stringify(cats, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'categories-nodeorg.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importCategoriesFromJSON(file: File): Promise<CustomCategory[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        if (!Array.isArray(parsed)) throw new Error('Format invalide')
        resolve(parsed as CustomCategory[])
      } catch {
        reject(new Error('Fichier JSON invalide'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture'))
    reader.readAsText(file)
  })
}

export type { PresetNode }
