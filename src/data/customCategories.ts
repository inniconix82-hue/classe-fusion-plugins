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

export type { PresetNode }
