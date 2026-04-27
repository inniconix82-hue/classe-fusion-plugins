import React, { useState, useEffect, useRef, useMemo } from 'react'
import { presetCategories, type PresetNode } from '../data/presets'
import { loadCustomCategories } from '../data/customCategories'

interface QuickSearchModalProps {
  onClose: () => void
  onAddNode: (preset: PresetNode) => void
}

interface FlatNode extends PresetNode {
  categoryName: string
  categoryIcon: string
}

export default function QuickSearchModal({ onClose, onAddNode }: QuickSearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const allNodes = useMemo<FlatNode[]>(() => {
    const customCats = loadCustomCategories()
    const allCats = [
      ...presetCategories,
      ...customCats.map((c) => ({ ...c, nodes: c.nodes as PresetNode[] })),
    ]
    return allCats.flatMap((cat) =>
      cat.nodes.map((n) => ({
        ...n,
        categoryName: cat.name,
        categoryIcon: cat.icon,
      }))
    )
  }, [])

  const results = useMemo<FlatNode[]>(() => {
    if (!query.trim()) {
      const customCats = loadCustomCategories()
      const allCats = [
        ...presetCategories,
        ...customCats.map((c) => ({ ...c, nodes: c.nodes as PresetNode[] })),
      ]
      const perCat = Math.max(2, Math.floor(20 / allCats.length))
      return allCats.flatMap((cat) =>
        cat.nodes.slice(0, perCat).map((n) => ({
          ...n,
          categoryName: cat.name,
          categoryIcon: cat.icon,
        }))
      ).slice(0, 20)
    }
    const q = query.toLowerCase()
    return allNodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.categoryName.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [query, allNodes])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        onAddNode(results[selectedIndex])
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="quick-search-overlay" onClick={onClose}>
      <div className="quick-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-search-input-row">
          <span className="quick-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="quick-search-input"
            placeholder="Rechercher un node… (Entrée pour ajouter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="quick-search-esc" onClick={onClose}>Esc</kbd>
        </div>
        <div className="quick-search-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="quick-search-empty">Aucun résultat pour "{query}"</div>
          ) : (
            results.map((node, i) => (
              <div
                key={`${node.categoryName}-${node.label}-${i}`}
                data-index={i}
                className={`quick-search-item ${i === selectedIndex ? 'quick-search-item-active' : ''}`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => { onAddNode(node); onClose() }}
              >
                <span className="quick-search-dot" style={{ background: node.color }} />
                <div className="quick-search-item-body">
                  <span className="quick-search-label">{node.label}</span>
                  {node.description && (
                    <span className="quick-search-desc">{node.description}</span>
                  )}
                </div>
                <span className="quick-search-cat">
                  {node.categoryIcon} {node.categoryName}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="quick-search-hint">
          ↑↓ Naviguer · Entrée Ajouter · Esc Fermer
        </div>
      </div>
    </div>
  )
}
