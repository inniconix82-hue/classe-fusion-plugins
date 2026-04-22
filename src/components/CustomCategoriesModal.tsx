import React, { useState, useEffect } from 'react'
import { type CustomCategory } from '../data/customCategories'
import { loadCustomCategories, saveCustomCategories, exportCategoriesToJSON, importCategoriesFromJSON } from '../data/customCategories'
import { type PresetNode } from '../data/presets'

interface CustomCategoriesModalProps {
  onClose: () => void
}

const ICON_OPTIONS = ['⭐', '🔥', '💡', '🎯', '🚀', '🌟', '🎪', '🏆', '📌', '🔑', '🌈', '💎', '🧩', '🛠️', '🌀', '🎵', '🏗️', '🌍', '🧠', '🎲']

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6', '#64748b', '#a855f7', '#059669',
]

const NODE_COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#0ea5e9',
  '#3b82f6', '#64748b', '#a855f7', '#059669', '#e11d48',
]

function generateId(): string {
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

const CustomCategoriesModal: React.FC<CustomCategoriesModalProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<CustomCategory[]>(() => loadCustomCategories())
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const importRef = React.useRef<HTMLInputElement>(null)

  // New category form
  const [showNewCatForm, setShowNewCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('⭐')
  const [newCatColor, setNewCatColor] = useState('#6366f1')

  // New node form state per category
  const [addingNodeFor, setAddingNodeFor] = useState<string | null>(null)
  const [newNodeLabel, setNewNodeLabel] = useState('')
  const [newNodeDesc, setNewNodeDesc] = useState('')
  const [newNodeColor, setNewNodeColor] = useState('#6366f1')

  const handleSave = () => {
    saveCustomCategories(categories)
    onClose()
  }

  const handleExport = () => {
    saveCustomCategories(categories)
    exportCategoriesToJSON(categories)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importCategoriesFromJSON(file)
      const merge = window.confirm(
        `${imported.length} catégorie(s) trouvée(s).\n\nCliquez OK pour fusionner avec vos catégories actuelles, ou Annuler pour remplacer.`
      )
      if (merge) {
        const existingIds = new Set(categories.map((c) => c.id))
        const newOnes = imported.filter((c) => !existingIds.has(c.id))
        setCategories((prev) => [...prev, ...newOnes])
      } else {
        setCategories(imported)
      }
    } catch (err: any) {
      alert(`Erreur d'importation : ${err.message}`)
    }
    if (importRef.current) importRef.current.value = ''
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const newCat: CustomCategory = {
      id: generateId(),
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      nodes: [],
      custom: true,
    }
    setCategories((prev) => [...prev, newCat])
    setNewCatName('')
    setNewCatIcon('⭐')
    setNewCatColor('#6366f1')
    setShowNewCatForm(false)
  }

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId))
    if (expandedCat === catId) setExpandedCat(null)
  }

  const handleAddNode = (catId: string) => {
    if (!newNodeLabel.trim()) return
    const newNode: PresetNode = {
      type: 'custom',
      label: newNodeLabel.trim(),
      description: newNodeDesc.trim(),
      category: catId,
      color: newNodeColor,
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, nodes: [...c.nodes, newNode] } : c
      )
    )
    setNewNodeLabel('')
    setNewNodeDesc('')
    setNewNodeColor('#6366f1')
    setAddingNodeFor(null)
  }

  const handleDeleteNode = (catId: string, nodeIdx: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, nodes: c.nodes.filter((_, i) => i !== nodeIdx) }
          : c
      )
    )
  }

  const toggleExpand = (catId: string) => {
    setExpandedCat((prev) => (prev === catId ? null : catId))
    setAddingNodeFor(null)
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content custom-cats-modal">
        <div className="modal-header">
          <h2>🗂️ Mes catégories</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="modal-btn" onClick={handleExport} title="Exporter les catégories en JSON" style={{ fontSize: 12 }}>
              ⬇ Exporter
            </button>
            <button className="modal-btn" onClick={() => importRef.current?.click()} title="Importer depuis un fichier JSON" style={{ fontSize: 12 }}>
              ⬆ Importer
            </button>
            <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="custom-cats-body">
          {categories.length === 0 && !showNewCatForm && (
            <div className="custom-cats-empty">
              <p>Aucune catégorie personnalisée.</p>
              <p>Créez votre première catégorie pour organiser vos nodes métier.</p>
            </div>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="custom-cat-item" style={{ borderLeftColor: cat.color }}>
              <div className="custom-cat-header">
                <button
                  className="custom-cat-toggle"
                  onClick={() => toggleExpand(cat.id)}
                  style={{ flex: 1, textAlign: 'left' }}
                >
                  <span className="custom-cat-icon">{cat.icon}</span>
                  <span className="custom-cat-name">{cat.name}</span>
                  <span className="custom-cat-count">{cat.nodes.length} node{cat.nodes.length !== 1 ? 's' : ''}</span>
                  <span className={`category-chevron ${expandedCat === cat.id ? 'expanded' : ''}`}>›</span>
                </button>
                <button
                  className="custom-cat-delete-btn"
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Supprimer la catégorie"
                >
                  🗑️
                </button>
              </div>

              {expandedCat === cat.id && (
                <div className="custom-cat-nodes">
                  {cat.nodes.map((node, idx) => (
                    <div key={idx} className="custom-node-row" style={{ borderLeftColor: node.color }}>
                      <div className="custom-node-info">
                        <span className="custom-node-label">{node.label}</span>
                        {node.description && (
                          <span className="custom-node-desc">{node.description}</span>
                        )}
                      </div>
                      <button
                        className="custom-node-delete-btn"
                        onClick={() => handleDeleteNode(cat.id, idx)}
                        title="Supprimer ce node"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {addingNodeFor === cat.id ? (
                    <div className="custom-node-form">
                      <input
                        className="custom-cats-input"
                        type="text"
                        placeholder="Nom du node *"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        autoFocus
                      />
                      <input
                        className="custom-cats-input"
                        type="text"
                        placeholder="Description (optionnelle)"
                        value={newNodeDesc}
                        onChange={(e) => setNewNodeDesc(e.target.value)}
                      />
                      <div className="custom-cats-color-row">
                        <span className="custom-cats-label">Couleur :</span>
                        <div className="custom-cats-colors">
                          {NODE_COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              className={`custom-cats-color-swatch ${newNodeColor === c ? 'selected' : ''}`}
                              style={{ background: c }}
                              onClick={() => setNewNodeColor(c)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="custom-node-form-actions">
                        <button
                          className="modal-btn primary"
                          onClick={() => handleAddNode(cat.id)}
                          disabled={!newNodeLabel.trim()}
                        >
                          Ajouter
                        </button>
                        <button
                          className="modal-btn"
                          onClick={() => { setAddingNodeFor(null); setNewNodeLabel(''); setNewNodeDesc('') }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="custom-cat-add-node-btn"
                      onClick={() => { setAddingNodeFor(cat.id); setNewNodeLabel(''); setNewNodeDesc(''); setNewNodeColor(cat.color) }}
                    >
                      + Ajouter un node
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {showNewCatForm && (
            <div className="custom-cat-new-form">
              <h3 className="custom-cats-form-title">Nouvelle catégorie</h3>
              <input
                className="custom-cats-input"
                type="text"
                placeholder="Nom de la catégorie *"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />
              <div className="custom-cats-icon-row">
                <span className="custom-cats-label">Icône :</span>
                <div className="custom-cats-icons">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      className={`custom-cats-icon-btn ${newCatIcon === icon ? 'selected' : ''}`}
                      onClick={() => setNewCatIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="custom-cats-color-row">
                <span className="custom-cats-label">Couleur :</span>
                <div className="custom-cats-colors">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      className={`custom-cats-color-swatch ${newCatColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewCatColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="custom-cat-form-actions">
                <button
                  className="modal-btn primary"
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim()}
                >
                  Créer
                </button>
                <button
                  className="modal-btn"
                  onClick={() => { setShowNewCatForm(false); setNewCatName('') }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {!showNewCatForm && (
            <button
              className="custom-cats-add-cat-btn"
              onClick={() => setShowNewCatForm(true)}
            >
              + Nouvelle catégorie
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>Fermer</button>
          <button className="modal-btn primary" onClick={handleSave}>
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomCategoriesModal
