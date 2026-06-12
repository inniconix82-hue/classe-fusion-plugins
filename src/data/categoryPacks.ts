import type { PresetCategory, PresetNode } from './presets'

export interface CategoryPack {
  id: string
  name: string
  icon: string
  description: string
  superCategoryId: string
  superCategoryName: string
  superCategoryIcon: string
  categories: PresetCategory[]
}

const INSTALLED_PACKS_KEY = 'nodeorg-installed-packs'

export function getInstalledPackIds(): string[] {
  try {
    const stored = localStorage.getItem(INSTALLED_PACKS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function installPack(packId: string) {
  const ids = getInstalledPackIds()
  if (!ids.includes(packId)) {
    localStorage.setItem(INSTALLED_PACKS_KEY, JSON.stringify([...ids, packId]))
  }
}

export function uninstallPack(packId: string) {
  const ids = getInstalledPackIds().filter((id) => id !== packId)
  localStorage.setItem(INSTALLED_PACKS_KEY, JSON.stringify(ids))
}

export function getInstalledPacks(): CategoryPack[] {
  const ids = getInstalledPackIds()
  return CATEGORY_PACKS.filter((p) => ids.includes(p.id))
}

export const CATEGORY_PACKS: CategoryPack[] = [
  {
    id: 'medical',
    name: 'Médical',
    icon: '🏥',
    description: 'Organes vitaux, spécialités, pathologies',
    superCategoryId: 'medical',
    superCategoryName: 'Médical & Santé',
    superCategoryIcon: '🏥',
    categories: [
      {
        id: 'organes',
        name: 'Organes vitaux',
        icon: '🫀',
        color: '#ef4444',
        nodes: [
          { type: 'custom', label: 'Cœur', description: 'Pompe sanguine, circulation', category: 'organes', color: '#ef4444' },
          { type: 'custom', label: 'Poumons', description: 'Respiration, échanges gazeux', category: 'organes', color: '#3b82f6' },
          { type: 'custom', label: 'Cerveau', description: 'Système nerveux central', category: 'organes', color: '#8b5cf6' },
          { type: 'custom', label: 'Foie', description: 'Métabolisme, détoxification', category: 'organes', color: '#f59e0b' },
          { type: 'custom', label: 'Reins', description: 'Filtration, épuration sanguine', category: 'organes', color: '#10b981' },
          { type: 'custom', label: 'Estomac', description: 'Digestion, suc gastrique', category: 'organes', color: '#f97316' },
          { type: 'custom', label: 'Intestins', description: 'Absorption, microbiote', category: 'organes', color: '#14b8a6' },
          { type: 'custom', label: 'Pancréas', description: 'Insuline, enzymes digestives', category: 'organes', color: '#6366f1' },
          { type: 'custom', label: 'Rate', description: 'Immunité, filtration du sang', category: 'organes', color: '#ec4899' },
          { type: 'custom', label: 'Peau', description: 'Protection, thermorégulation', category: 'organes', color: '#a855f7' },
        ],
      },
      {
        id: 'specialites-med',
        name: 'Spécialités médicales',
        icon: '🩺',
        color: '#3b82f6',
        nodes: [
          { type: 'custom', label: 'Cardiologie', description: 'Maladies du cœur', category: 'specialites-med', color: '#ef4444' },
          { type: 'custom', label: 'Neurologie', description: 'Système nerveux', category: 'specialites-med', color: '#8b5cf6' },
          { type: 'custom', label: 'Pneumologie', description: 'Voies respiratoires', category: 'specialites-med', color: '#3b82f6' },
          { type: 'custom', label: 'Gastro-entérologie', description: 'Appareil digestif', category: 'specialites-med', color: '#f97316' },
          { type: 'custom', label: 'Dermatologie', description: 'Peau et phanères', category: 'specialites-med', color: '#ec4899' },
          { type: 'custom', label: 'Psychiatrie', description: 'Santé mentale', category: 'specialites-med', color: '#6366f1' },
          { type: 'custom', label: 'Pédiatrie', description: 'Enfants et adolescents', category: 'specialites-med', color: '#10b981' },
          { type: 'custom', label: 'Chirurgie', description: 'Interventions opératoires', category: 'specialites-med', color: '#64748b' },
        ],
      },
    ],
  },
  {
    id: 'economie',
    name: 'Économie',
    icon: '📈',
    description: 'Macro/micro économie, marchés, indicateurs',
    superCategoryId: 'economie',
    superCategoryName: 'Économie & Finance',
    superCategoryIcon: '📈',
    categories: [
      {
        id: 'macro-eco',
        name: 'Macroéconomie',
        icon: '🌍',
        color: '#3b82f6',
        nodes: [
          { type: 'custom', label: 'PIB', description: 'Produit intérieur brut', category: 'macro-eco', color: '#3b82f6' },
          { type: 'custom', label: 'Inflation', description: 'Hausse générale des prix', category: 'macro-eco', color: '#ef4444' },
          { type: 'custom', label: 'Chômage', description: 'Taux et indicateurs emploi', category: 'macro-eco', color: '#f97316' },
          { type: 'custom', label: 'Balance commerciale', description: 'Import / Export', category: 'macro-eco', color: '#10b981' },
          { type: 'custom', label: 'Dette publique', description: 'Endettement de l\'État', category: 'macro-eco', color: '#8b5cf6' },
          { type: 'custom', label: 'Politique monétaire', description: 'Taux directeurs, BCE', category: 'macro-eco', color: '#6366f1' },
          { type: 'custom', label: 'Croissance', description: 'Expansion économique', category: 'macro-eco', color: '#14b8a6' },
        ],
      },
      {
        id: 'micro-eco',
        name: 'Microéconomie',
        icon: '🏪',
        color: '#10b981',
        nodes: [
          { type: 'custom', label: 'Offre / Demande', description: 'Équilibre de marché', category: 'micro-eco', color: '#10b981' },
          { type: 'custom', label: 'Coût marginal', description: 'Coût de production +1', category: 'micro-eco', color: '#f59e0b' },
          { type: 'custom', label: 'Élasticité', description: 'Sensibilité prix/demande', category: 'micro-eco', color: '#3b82f6' },
          { type: 'custom', label: 'Monopole', description: 'Un seul offreur', category: 'micro-eco', color: '#ef4444' },
          { type: 'custom', label: 'Concurrence', description: 'Marché concurrentiel', category: 'micro-eco', color: '#8b5cf6' },
          { type: 'custom', label: 'Externalité', description: 'Effets non compensés', category: 'micro-eco', color: '#64748b' },
        ],
      },
    ],
  },
  {
    id: 'droit',
    name: 'Droit',
    icon: '⚖️',
    description: 'Branches du droit, procédure, concepts juridiques',
    superCategoryId: 'droit',
    superCategoryName: 'Droit & Juridique',
    superCategoryIcon: '⚖️',
    categories: [
      {
        id: 'droit-branches',
        name: 'Branches du droit',
        icon: '📜',
        color: '#6366f1',
        nodes: [
          { type: 'custom', label: 'Droit civil', description: 'Personnes, contrats, obligations', category: 'droit-branches', color: '#3b82f6' },
          { type: 'custom', label: 'Droit pénal', description: 'Infractions, sanctions', category: 'droit-branches', color: '#ef4444' },
          { type: 'custom', label: 'Droit du travail', description: 'Contrat, licenciement, syndicats', category: 'droit-branches', color: '#f59e0b' },
          { type: 'custom', label: 'Droit administratif', description: 'État, collectivités', category: 'droit-branches', color: '#8b5cf6' },
          { type: 'custom', label: 'Droit commercial', description: 'Sociétés, commerce', category: 'droit-branches', color: '#10b981' },
          { type: 'custom', label: 'Droit constitutionnel', description: 'Constitution, libertés', category: 'droit-branches', color: '#6366f1' },
          { type: 'custom', label: 'Droit international', description: 'Traités, conventions', category: 'droit-branches', color: '#64748b' },
        ],
      },
    ],
  },
  {
    id: 'sciences',
    name: 'Sciences',
    icon: '🔬',
    description: 'Physique, chimie, biologie, géologie',
    superCategoryId: 'sciences',
    superCategoryName: 'Sciences & Nature',
    superCategoryIcon: '🔬',
    categories: [
      {
        id: 'physique',
        name: 'Physique',
        icon: '⚛️',
        color: '#3b82f6',
        nodes: [
          { type: 'custom', label: 'Mécanique', description: 'Forces, mouvement', category: 'physique', color: '#3b82f6' },
          { type: 'custom', label: 'Thermodynamique', description: 'Chaleur, énergie', category: 'physique', color: '#ef4444' },
          { type: 'custom', label: 'Optique', description: 'Lumière, réfraction', category: 'physique', color: '#f59e0b' },
          { type: 'custom', label: 'Électromagnétisme', description: 'Champs, ondes', category: 'physique', color: '#8b5cf6' },
          { type: 'custom', label: 'Relativité', description: 'Espace-temps, Einstein', category: 'physique', color: '#6366f1' },
          { type: 'custom', label: 'Quantique', description: 'Particules, probabilités', category: 'physique', color: '#10b981' },
        ],
      },
      {
        id: 'biologie',
        name: 'Biologie',
        icon: '🧬',
        color: '#10b981',
        nodes: [
          { type: 'custom', label: 'Cellule', description: 'Unité fondamentale du vivant', category: 'biologie', color: '#10b981' },
          { type: 'custom', label: 'ADN', description: 'Génétique, code héréditaire', category: 'biologie', color: '#3b82f6' },
          { type: 'custom', label: 'Évolution', description: 'Sélection naturelle, Darwin', category: 'biologie', color: '#f59e0b' },
          { type: 'custom', label: 'Écosystème', description: 'Interactions milieu/vivant', category: 'biologie', color: '#14b8a6' },
          { type: 'custom', label: 'Métabolisme', description: 'Réactions biochimiques', category: 'biologie', color: '#8b5cf6' },
          { type: 'custom', label: 'Système immunitaire', description: 'Défenses de l\'organisme', category: 'biologie', color: '#ef4444' },
        ],
      },
    ],
  },
  {
    id: 'psychologie',
    name: 'Psychologie',
    icon: '🧠',
    description: 'Courants, concepts, développement',
    superCategoryId: 'psychologie',
    superCategoryName: 'Psychologie',
    superCategoryIcon: '🧠',
    categories: [
      {
        id: 'psych-concepts',
        name: 'Concepts clés',
        icon: '💭',
        color: '#a855f7',
        nodes: [
          { type: 'custom', label: 'Cognition', description: 'Pensée, mémoire, attention', category: 'psych-concepts', color: '#8b5cf6' },
          { type: 'custom', label: 'Émotion', description: 'Affects, régulation', category: 'psych-concepts', color: '#ef4444' },
          { type: 'custom', label: 'Motivation', description: 'Besoin, pulsion, volonté', category: 'psych-concepts', color: '#f59e0b' },
          { type: 'custom', label: 'Attachement', description: 'Bowlby, lien affectif', category: 'psych-concepts', color: '#ec4899' },
          { type: 'custom', label: 'Résilience', description: 'Rebond après trauma', category: 'psych-concepts', color: '#10b981' },
          { type: 'custom', label: 'Transfert', description: 'Projection sur autrui', category: 'psych-concepts', color: '#6366f1' },
          { type: 'custom', label: 'Inconscient', description: 'Freud, processus non conscients', category: 'psych-concepts', color: '#64748b' },
          { type: 'custom', label: 'Développement', description: 'Piaget, stades cognitifs', category: 'psych-concepts', color: '#3b82f6' },
        ],
      },
    ],
  },
  {
    id: 'histoire',
    name: 'Histoire',
    icon: '📚',
    description: 'Grandes périodes, événements, civilisations',
    superCategoryId: 'histoire',
    superCategoryName: 'Histoire & Géo',
    superCategoryIcon: '📚',
    categories: [
      {
        id: 'periodes',
        name: 'Grandes périodes',
        icon: '🏛️',
        color: '#f59e0b',
        nodes: [
          { type: 'custom', label: 'Antiquité', description: '3000 av. J.-C. – 476', category: 'periodes', color: '#f59e0b' },
          { type: 'custom', label: 'Moyen Âge', description: '476 – 1492', category: 'periodes', color: '#8b5cf6' },
          { type: 'custom', label: 'Renaissance', description: 'XVe – XVIe siècle', category: 'periodes', color: '#10b981' },
          { type: 'custom', label: 'Lumières', description: 'XVIIIe siècle', category: 'periodes', color: '#3b82f6' },
          { type: 'custom', label: 'Révolution française', description: '1789 – 1799', category: 'periodes', color: '#ef4444' },
          { type: 'custom', label: 'Révolution industrielle', description: 'XIXe siècle', category: 'periodes', color: '#64748b' },
          { type: 'custom', label: 'Guerres mondiales', description: '1914-1918, 1939-1945', category: 'periodes', color: '#dc2626' },
          { type: 'custom', label: 'Époque contemporaine', description: '1945 – aujourd\'hui', category: 'periodes', color: '#6366f1' },
        ],
      },
    ],
  },
]
