import React from 'react'

const SECTIONS = [
  {
    title: '🖱️ Canvas',
    items: [
      'Glisser un node depuis la sidebar → le déposer sur le canvas',
      'Double-clic sur un node → éditer le titre',
      'Clic droit sur un node → menu contextuel',
      'Connecter deux nodes → tirer depuis le point de connexion',
      'Sélection multiple → maintenir Shift + cliquer',
      'Déplacer le canvas → clic gauche maintenu sur le fond',
      'Zoom → molette de la souris',
    ],
  },
  {
    title: '⌨️ Raccourcis clavier',
    items: [
      'Ctrl+S → Sauvegarder',
      'Ctrl+O → Ouvrir un projet',
      'Ctrl+Z → Annuler',
      'Ctrl+Y → Refaire',
      'Ctrl+L → Auto-layout',
      'Ctrl+F → Adapter le zoom',
      'Ctrl+A → Tout sélectionner',
      'Suppr / Backspace → Supprimer la sélection',
    ],
  },
  {
    title: '🤖 Ollama IA',
    items: [
      'Cliquer sur "Générer avec Ollama" dans la sidebar',
      'Onglet "Carte mentale" → poser une question → crée un node automatiquement',
      'Onglet "Générer texte" → génère du contenu depuis les nodes du canvas',
      'Importer un PDF → alimenter la base de connaissances d\'Ollama',
      'Si Ollama est hors ligne → cliquer sur ▶ Lancer',
      '🔒 Une connexion internet est uniquement nécessaire au téléchargement des modèles. Ensuite tout fonctionne en local, vos données ne quittent jamais votre machine.',
    ],
  },
  {
    title: '📝 Éditeur de document',
    items: [
      'Cliquer sur "Éditeur de document" dans la sidebar',
      'Toolbar : titres, gras, italique, listes, couleur de texte',
      'Exporter en PDF → bouton "Exporter PDF" en bas',
      'Envoyer le contenu Ollama dans l\'éditeur → bouton "Envoyer dans l\'éditeur"',
    ],
  },
  {
    title: '🟦 Zones (Underlay)',
    items: [
      'Cliquer sur "Ajouter une zone" dans la sidebar',
      'Double-clic sur la zone → renommer',
      'Cliquer sur le carré coloré → changer la couleur',
      'Tirer les poignées bleues → redimensionner',
      'La zone se place derrière les nodes automatiquement',
    ],
  },
  {
    title: '🖼️ Node Vignette',
    items: [
      'Glisser le node "Vignette" depuis la catégorie Outils',
      'Cliquer sur la zone d\'image → uploader une image',
      'Double-clic sur le titre → renommer',
    ],
  },
]

interface HelpModalProps {
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-content-lg help-modal">
        <div className="modal-header">
          <h2>❓ Guide rapide</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="help-sections">
          {SECTIONS.map((section) => (
            <div key={section.title} className="help-section">
              <div className="help-section-title">{section.title}</div>
              <ul className="help-section-list">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="modal-btn primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
