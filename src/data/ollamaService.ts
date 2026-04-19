import type { Node, Edge } from '@xyflow/react'

const OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'tinyllama'

const STORAGE_KEY = 'nodeorg-ollama-model'

export function getOllamaModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODEL
  } catch {
    return DEFAULT_MODEL
  }
}

export function setOllamaModel(model: string) {
  localStorage.setItem(STORAGE_KEY, model)
}

export type OllamaStyle = 'synthese' | 'detaille' | 'reunion' | 'cours'

function nodeLabel(node: Node): string {
  const d = node.data as { label?: string; description?: string }
  const label = d.label || 'Sans titre'
  const desc = d.description ? ` (${d.description})` : ''
  return `${label}${desc}`
}

function buildBranches(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return 'Aucun nœud sur le canvas.'

  // Exclude structural nodes (router = junction point, underlay = background zone)
  const contentNodes = nodes.filter((n) => n.type !== 'underlay' && n.type !== 'router')
  if (contentNodes.length === 0) return 'Aucun nœud de contenu sur le canvas.'

  const contentIds = new Set(contentNodes.map((n) => n.id))
  const contentEdges = edges.filter((e) => contentIds.has(e.source) && contentIds.has(e.target))
  const nodeMap = new Map(contentNodes.map((n) => [n.id, n]))

  const hasIncoming = new Set(contentEdges.map((e) => e.target))
  const roots = contentNodes.filter((n) => !hasIncoming.has(n.id))

  function buildPath(nodeId: string, visited = new Set<string>()): string[][] {
    if (visited.has(nodeId)) return [[]]
    visited.add(nodeId)
    const node = nodeMap.get(nodeId)
    if (!node) return [[]]
    const label = nodeLabel(node)
    const children = contentEdges.filter((e) => e.source === nodeId).map((e) => e.target)
    if (children.length === 0) return [[label]]
    return children.flatMap((child) =>
      buildPath(child, new Set(visited)).map((path) => [label, ...path])
    )
  }

  if (roots.length === 0 || contentEdges.length === 0) {
    return contentNodes.map((n) => `- ${nodeLabel(n)}`).join('\n')
  }

  const branches = roots.flatMap((root) => buildPath(root.id))
  return branches.map((path, i) => `Branche ${i + 1} : ${path.join(' → ')}`).join('\n')
}

function buildDetectivePrompt(nodes: Node[], edges: Edge[], instructions: string): string {
  const structure = buildBranches(nodes, edges)
  const instructionBlock = instructions.trim()
    ? `\nINSTRUCTIONS SPÉCIFIQUES :\n${instructions.trim()}\n`
    : ''
  return `Tu es un assistant d'analyse factuelle pour une enquête.${instructionBlock}
Voici les éléments de l'enquête (nodes) et leurs connexions :

${structure}

RÈGLES STRICTES — ANTI-HALLUCINATION :
- Utilise UNIQUEMENT les informations des nodes fournis ci-dessus
- Si une connexion n'est pas présente dans les nodes, réponds "non établi"
- Ne complète JAMAIS avec des informations extérieures ou inventées
- Cite le node source pour chaque affirmation (ex: "[Indice clé]")
- Si tu ne trouves pas la source dans les nodes, ne réponds pas sur ce point

Format de réponse Markdown :
# Synthèse de l'enquête
## Suspects identifiés
- **[Nom]** : [Mobile/Alibi] — source : [node]
## Indices disponibles
- [Indice] — source : [node]
## Hypothèses
- **[Hypothèse]** (probabilité : X/10) — basé sur : [nodes sources]
## Faits établis
- [Fait] — confirmé par : [node]
## Points non établis
- [Éléments manquants ou contradictoires]

Réponds uniquement en français.`
}

function buildPromptFromNodes(nodes: Node[], style: OllamaStyle = 'synthese', edges: Edge[] = [], instructions = ''): string {
  if (nodes.length === 0) return 'Aucun nœud sur le canvas.'

  const hasDetective = nodes.some((n) => n.type === 'detective')
  if (hasDetective) return buildDetectivePrompt(nodes, edges, instructions)

  const structure = buildBranches(nodes, edges)

  const styleInstructions = {
    synthese: `Utilise ce format Markdown STRICT :
# Titre principal (1 seul)
- **terme clé** : explication courte (max 5-7 points)
Pas d'introduction. Pas de conclusion. Seulement des bullets avec termes en gras.`,
    detaille: `Utilise ce format Markdown STRICT :
# Titre principal
## Section pour chaque branche
Paragraphes développés. **Termes importants** en gras.
### Sous-sections si nécessaire
- listes pour les points clés
Crée des liens narratifs entre les branches.`,
    reunion: `Utilise ce format Markdown STRICT pour un compte-rendu de réunion :
# Ordre du jour / Sujet
## Points abordés (une section H2 par branche)
- **Décision** : ...
- **Action** : responsable + délai
## Prochaines étapes
- liste des actions à mener`,
    cours: `Utilise ce format Markdown STRICT pour un contenu pédagogique :
# Titre du cours
## Introduction
Contexte et objectifs d'apprentissage.
## Concept (une section H2 par branche)
Explication claire. **Termes clés** en gras.
### Exemple concret
- points illustratifs
## Résumé
- **point essentiel** à retenir par concept`,
  }

  const instructionBlock = instructions.trim()
    ? `\nINSTRUCTIONS SPÉCIFIQUES (priorité absolue) :\n${instructions.trim()}\n`
    : ''

  return `Tu es un assistant professionnel.${instructionBlock}
Voici les étiquettes (labels) d'une carte mentale et leurs connexions :

${structure}

RÈGLES IMPORTANTES :
- Ces labels sont des concepts, noms ou idées — PAS des termes techniques à définir
- Ne décris JAMAIS un label comme s'il était un objet informatique ou un composant logiciel
- Traite chaque label comme un sujet ou un thème à développer selon son contexte
- Chaque branche représente un chemin de pensée distinct dans la carte

${styleInstructions[style]}

IMPORTANT : Réponds UNIQUEMENT en Markdown valide. Réponds en français.`
}

export interface OllamaResponse {
  text: string
  error?: string
}

export async function generateFromNodes(
  nodes: Node[],
  onToken?: (token: string) => void,
  style: OllamaStyle = 'synthese',
  edges: Edge[] = [],
  instructions = ''
): Promise<OllamaResponse> {
  const prompt = buildPromptFromNodes(nodes, style, edges, instructions)
  const model = getOllamaModel()

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: !!onToken,
      }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          text: '',
          error: `Modèle "${model}" non trouvé. Installez-le avec : ollama pull ${model}`,
        }
      }
      return {
        text: '',
        error: `Erreur Ollama (${response.status}): ${response.statusText}`,
      }
    }

    if (onToken && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) {
              fullText += json.response
              onToken(json.response)
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      return { text: fullText }
    }

    const json = await response.json()
    return { text: json.response || '' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('ECONNREFUSED')) {
      return {
        text: '',
        error:
          'Impossible de se connecter à Ollama. Vérifiez qu\'Ollama est lancé sur http://localhost:11434\n\nPour lancer Ollama :\n  ollama serve\n\nSi vous êtes dans un navigateur, lancez avec :\n  OLLAMA_ORIGINS="*" ollama serve',
      }
    }
    return { text: '', error: `Erreur: ${message}` }
  }
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' })
    if (!res.ok) return []
    const json = await res.json()
    return (json.models || []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}

// Knowledge base storage
const KB_STORAGE_KEY = 'nodeorg-knowledge-base'

export function getKnowledgeBase(): string[] {
  try {
    const stored = localStorage.getItem(KB_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function addToKnowledgeBase(text: string) {
  const chunks = chunkText(text, 500)
  const current = getKnowledgeBase()
  const updated = [...current, ...chunks]
  localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(updated))
}

export function clearKnowledgeBase() {
  localStorage.removeItem(KB_STORAGE_KEY)
}

function chunkText(text: string, maxLen: number): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 20)
  const chunks: string[] = []
  let current = ''
  for (const p of paragraphs) {
    if (current.length + p.length > maxLen && current.length > 0) {
      chunks.push(current.trim())
      current = ''
    }
    current += p + '\n\n'
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function findRelevantChunks(question: string, chunks: string[], maxChunks = 3): string[] {
  const words = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  if (words.length === 0 || chunks.length === 0) return []

  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase()
    let score = 0
    for (const word of words) {
      if (lower.includes(word)) score++
    }
    return { chunk, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((s) => s.chunk)
}

export async function hasInstalledModels(): Promise<boolean> {
  try {
    const models = await listModels()
    return models.length > 0
  } catch {
    return false
  }
}

export interface MindMapResponse {
  title: string
  description: string
  error?: string
}

export async function askQuestion(question: string): Promise<MindMapResponse> {
  const model = getOllamaModel()
  const kb = getKnowledgeBase()
  const relevantChunks = findRelevantChunks(question, kb)

  let contextBlock = ''
  if (relevantChunks.length > 0) {
    contextBlock = `\nContexte documentaire :\n${relevantChunks.join('\n---\n')}\n`
  }

  const prompt = `Tu es un assistant qui répond de manière ULTRA concise pour créer des cartes mentales.${contextBlock}

Question : ${question}

RÈGLES STRICTES :
- Titre : 1 à 3 mots maximum (le concept clé)
- Description : maximum 5-8 mots (définition express)
- Format EXACT de ta réponse (rien d'autre) :
TITRE: [ton titre]
DESC: [ta description courte]

Réponds en français.`

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { title: '', description: '', error: `Modèle "${model}" non trouvé.` }
      }
      return { title: '', description: '', error: `Erreur Ollama (${response.status})` }
    }

    const json = await response.json()
    const text = json.response || ''

    // Parse the response
    const titleMatch = text.match(/TITRE\s*:\s*(.+)/i)
    const descMatch = text.match(/DESC\s*:\s*(.+)/i)

    const title = titleMatch ? titleMatch[1].trim() : question.slice(0, 30)
    const description = descMatch ? descMatch[1].trim() : text.slice(0, 50).trim()

    return { title, description }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Failed to fetch') || message.includes('ECONNREFUSED')) {
      return { title: '', description: '', error: 'Ollama non connecté' }
    }
    return { title: '', description: '', error: message }
  }
}

// Maps intent labels returned by the model to actual category IDs
const INTENT_TO_CATEGORIES: Record<string, string[]> = {
  personnes:    ['personnes'],
  projet:       ['gestion-projet'],
  finance:      ['finance'],
  business:     ['entreprise', 'finance', 'marketing', 'rh'],
  creativite:   ['creativite', 'scenario', 'audiovisuel', 'contenu'],
  tech:         ['ia', 'dev'],
  social:       ['action-sociale'],
  education:    ['education'],
  productivite: ['outils', 'productivite', 'journee'],
  evenementiel: ['evenementiel'],
}

export async function classifySearchIntent(query: string): Promise<string[]> {
  const model = getOllamaModel()
  const prompt = `Tu aides à classifier une requête de recherche pour une application de carte mentale.
Requête : "${query}"

Choisis 1 à 3 catégories pertinentes parmi cette liste exacte :
personnes, projet, finance, business, creativite, tech, social, education, productivite, evenementiel

Réponds UNIQUEMENT avec les noms de catégories séparés par des virgules. Rien d'autre.`

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    })
    if (!res.ok) return []
    const json = await res.json()
    const text = (json.response || '').toLowerCase()
    const matched = Object.keys(INTENT_TO_CATEGORIES).filter((k) => text.includes(k))
    return matched.flatMap((k) => INTENT_TO_CATEGORIES[k])
  } catch {
    return []
  }
}
