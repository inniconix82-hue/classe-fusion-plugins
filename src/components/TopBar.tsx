import React from 'react'
import type { LayoutDirection } from '../data/layoutUtils'
import type { TaskMode } from '../data/presets'

interface TopBarProps {
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onExportPNG: () => void
  onExportPDF: () => void
  onOpenTemplates: () => void
  onOpenShortcuts: () => void
  onShowHelp: () => void
  onShowWelcome: () => void
  onAutoLayout: () => void
  onToggleDirection: () => void
  onFitView: () => void
  onAddUnderlay: () => void
  onManageCategories: () => void
  layoutDirection: LayoutDirection
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  activeTaskMode: TaskMode | null
}

const TopBar: React.FC<TopBarProps> = ({
  onSave, onLoad, onClear,
  onExportPNG, onExportPDF,
  onOpenTemplates, onOpenShortcuts, onShowHelp, onShowWelcome,
  onAutoLayout, onToggleDirection, onFitView, onAddUnderlay,
  onManageCategories,
  layoutDirection, theme, onToggleTheme,
  activeTaskMode,
}) => (
  <div className="top-bar">
    {/* File */}
    <button className="tb-btn" onClick={onSave} title="Sauvegarder (Ctrl+S)">💾</button>
    <button className="tb-btn" onClick={onLoad} title="Ouvrir (Ctrl+O)">📂</button>
    <button className="tb-btn" onClick={onClear} title="Nouveau (Ctrl+N)">🗑️</button>

    <div className="tb-sep" />

    {/* Layout */}
    <button className="tb-btn" onClick={onAutoLayout} title="Auto Layout (Ctrl+L)">🔀</button>
    <button className="tb-btn" onClick={onToggleDirection} title={layoutDirection === 'TB' ? 'Passer en horizontal' : 'Passer en vertical'}>
      {layoutDirection === 'TB' ? '↕' : '↔'}
    </button>
    <button className="tb-btn" onClick={onFitView} title="Zoom adapté (Ctrl+F)">⊡</button>
    <button className="tb-btn" onClick={onAddUnderlay} title="Ajouter une zone (Ctrl+G)">🟦</button>

    <div className="tb-sep" />

    {/* Export */}
    <button className="tb-btn" onClick={onExportPNG} title="Exporter PNG (Ctrl+Shift+P)">🖼️</button>
    <button className="tb-btn" onClick={onExportPDF} title="Exporter PDF (Ctrl+Shift+E)">📄</button>

    <div className="tb-sep" />

    {/* Tools */}
    <button className="tb-btn" onClick={onOpenTemplates} title="Templates (Ctrl+T)">📋</button>
    <button className="tb-btn" onClick={onManageCategories} title="Mes catégories (Ctrl+Shift+C)">🗂️</button>
    <button className="tb-btn" onClick={onOpenShortcuts} title="Raccourcis clavier (Ctrl+K)">⌨️</button>

    {/* Spacer */}
    <div className="tb-spacer" />

    {/* Right side */}
    {activeTaskMode && (
      <button className="tb-mode-badge" onClick={onShowWelcome} title="Changer de mode">
        {activeTaskMode.icon} {activeTaskMode.name}
      </button>
    )}
    {!activeTaskMode && (
      <button className="tb-btn" onClick={onShowWelcome} title="Accueil / Changer de mode">🏠</button>
    )}

    <button className="tb-btn" onClick={onShowHelp} title="Aide (F1)">❓</button>
    <button className="tb-btn tb-theme" onClick={onToggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  </div>
)

export default TopBar
