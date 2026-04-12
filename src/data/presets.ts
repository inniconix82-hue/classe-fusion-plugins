export interface PresetNode {
  type: string
  label: string
  description: string
  category: string
  color: string
}

export interface PresetCategory {
  id: string
  name: string
  icon: string
  color: string
  nodes: PresetNode[]
}

export const presetCategories: PresetCategory[] = [
  {
    id: 'organisation',
    name: 'Organisation Basique',
    icon: '📋',
    color: '#6366f1',
    nodes: [
      {
        type: 'org',
        label: 'Objectif',
        description: 'Définir l\'objectif principal',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Planification',
        description: 'Planifier les étapes',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Ressources',
        description: 'Identifier les ressources nécessaires',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Équipe',
        description: 'Membres et rôles',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Tâche',
        description: 'Une tâche à accomplir',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Deadline',
        description: 'Date limite',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Livrable',
        description: 'Résultat attendu',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Validation',
        description: 'Étape de validation',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Budget',
        description: 'Budget alloué',
        category: 'organisation',
        color: '#6366f1',
      },
      {
        type: 'org',
        label: 'Note',
        description: 'Note ou commentaire',
        category: 'organisation',
        color: '#6366f1',
      },
    ],
  },
  {
    id: 'montage-video',
    name: 'Montage Vidéo',
    icon: '🎬',
    color: '#ec4899',
    nodes: [
      {
        type: 'video',
        label: 'Pré-production',
        description: 'Scénario, storyboard, repérages',
        category: 'montage-video',
        color: '#ec4899',
      },
      {
        type: 'video',
        label: 'Tournage',
        description: 'Captation des images et sons',
        category: 'montage-video',
        color: '#ec4899',
      },
      {
        type: 'video',
        label: 'Dérushage',
        description: 'Tri et sélection des rushes',
        category: 'montage-video',
        color: '#ec4899',
      },
      {
        type: 'video',
        label: 'Montage',
        description: 'Assemblage et cut des séquences',
        category: 'montage-video',
        color: '#ec4899',
      },
      {
        type: 'video',
        label: 'Motion Design',
        description: 'Animations, titres, graphismes animés',
        category: 'montage-video',
        color: '#f97316',
      },
      {
        type: 'video',
        label: 'Étalonnage',
        description: 'Correction colorimétrique et look',
        category: 'montage-video',
        color: '#eab308',
      },
      {
        type: 'video',
        label: 'VFX',
        description: 'Effets visuels et compositing',
        category: 'montage-video',
        color: '#14b8a6',
      },
      {
        type: 'video',
        label: 'Sound Design',
        description: 'Création et design sonore',
        category: 'montage-video',
        color: '#8b5cf6',
      },
      {
        type: 'video',
        label: 'Mixage Audio',
        description: 'Mixage et mastering du son',
        category: 'montage-video',
        color: '#8b5cf6',
      },
      {
        type: 'video',
        label: 'Sous-titrage',
        description: 'Création des sous-titres',
        category: 'montage-video',
        color: '#64748b',
      },
      {
        type: 'video',
        label: 'Export',
        description: 'Encodage et rendu final',
        category: 'montage-video',
        color: '#22c55e',
      },
      {
        type: 'video',
        label: 'Livraison',
        description: 'Diffusion et livraison au client',
        category: 'montage-video',
        color: '#22c55e',
      },
    ],
  },
]
