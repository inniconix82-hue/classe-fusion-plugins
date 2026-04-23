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
  const d = node.data as { label?: string; description?: string; category?: string }
  const label = d.label || 'Sans titre'
  const desc = d.description ? ` — ${d.description}` : ''
  const cat = d.category ? ` [${d.category}]` : ''
  return `${label}${desc}${cat}`
}

function edgeConnector(edge: Edge): string {
  const label = ((edge.data as any)?.label as string || '').trim().toUpperCase()
  const linkType = (edge.data as any)?.linkType as string | undefined

  // Semantic logical connectors take priority
  const logicalConnectors = ['ET', 'OU', 'SI', 'ALORS', 'SINON', 'DONC', 'CAR', 'MAIS', 'SAUF']
  if (logicalConnectors.includes(label)) return `--${label}→`

  // Named edge type (detective mode)
  if (linkType && linkType !== 'lié') return `--[${linkType}]→`

  // Free text label
  if (label) return `--"${label}"→`

  return '→'
}

function buildBranches(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return 'Aucun nœud sur le canvas.'

  const contentNodes = nodes.filter((n) => n.type !== 'underlay' && n.type !== 'router')
  if (contentNodes.length === 0) return 'Aucun nœud de contenu sur le canvas.'

  const contentIds = new Set(contentNodes.map((n) => n.id))
  const contentEdges = edges.filter((e) => contentIds.has(e.source) && contentIds.has(e.target))
  const nodeMap = new Map(contentNodes.map((n) => [n.id, n]))
  const edgeMap = new Map(contentEdges.map((e) => [`${e.source}→${e.target}`, e]))

  const hasIncoming = new Set(contentEdges.map((e) => e.target))
  const roots = contentNodes.filter((n) => !hasIncoming.has(n.id))

  // Build paths as sequences of [nodeLabel, connector, nodeLabel, ...]
  function buildPath(nodeId: string, visited = new Set<string>()): string[][] {
    if (visited.has(nodeId)) return [[]]
    visited.add(nodeId)
    const node = nodeMap.get(nodeId)
    if (!node) return [[]]
    const label = nodeLabel(node)
    const outEdges = contentEdges.filter((e) => e.source === nodeId)
    if (outEdges.length === 0) return [[label]]
    return outEdges.flatMap((edge) => {
      const connector = edgeConnector(edge)
      return buildPath(edge.target, new Set(visited)).map((path) =>
        path.length > 0 ? [label, connector, ...path] : [label]
      )
    })
  }

  if (roots.length === 0 || contentEdges.length === 0) {
    // No connections — list nodes with their metadata
    return contentNodes.map((n) => `- ${nodeLabel(n)}`).join('\n')
  }

  const branches = roots.flatMap((root) => buildPath(root.id))
  return branches.map((path, i) => `Branche ${i + 1} : ${path.join(' ')}`).join('\n')
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

const GRAPH_SYSTEM_RULES = `Tu es un assistant d'analyse et de rédaction intégré à un outil de graphe de nodes.

RÈGLES D'INTERPRÉTATION (à respecter impérativement) :

1. PRIORITÉ AU CONTENU DES NODES
   - Interprète d'abord le sens exprimé par le texte, le titre et la description de chaque node.
   - Le contenu textuel des nodes est toujours plus important que leur catégorie.

2. PRIORITÉ AUX RELATIONS ET CONNEXIONS
   - Utilise les connexions entre nodes pour reconstruire la logique et l'intention.
   - Une connexion de type ET signifie que les deux branches s'appliquent simultanément.
   - Une connexion de type OU signifie que l'une ou l'autre branche s'applique.
   - Une connexion de type SI introduit une condition : traite la branche comme un scénario conditionnel.
   - Une connexion de type ALORS introduit une conséquence directe.
   - Une connexion de type SINON introduit le cas alternatif si la condition SI n'est pas remplie.
   - Les labels libres sur les connexions (entre guillemets) expriment la nature du lien : tiens-en compte.

3. RÔLE DES CATÉGORIES
   - Les catégories (entre crochets) sont des métadonnées de classement, pas le sujet principal.
   - N'utilise une catégorie comme axe d'interprétation que si plusieurs nodes convergent vers elle ET que leur contenu textuel le confirme.
   - En cas de conflit entre catégorie et contenu des nodes, le contenu des nodes prime toujours.

4. BRANCHES CONDITIONNELLES
   - Si le graphe contient des branches séparées reliées par un node commun, traite chaque branche comme un scénario distinct.
   - Formule chaque scénario explicitement : "Dans le cas où... / Si... alors..."
   - Identifie et mentionne les éléments communs à tous les scénarios après les avoir distingués.

5. COHÉRENCE GLOBALE
   - Ton texte doit suivre la logique du graphe, pas une logique de liste ou d'inventaire.
   - Évite de simplement énumérer les nodes : construis un raisonnement à partir de leur structure.
   - Ne décris jamais un node comme un objet informatique ou technique — traite-le comme un sujet ou un thème.`

function buildPromptFromNodes(nodes: Node[], style: OllamaStyle = 'synthese', edges: Edge[] = [], instructions = ''): string {
  if (nodes.length === 0) return 'Aucun nœud sur le canvas.'

  const hasDetective = nodes.some((n) => n.type === 'detective')
  if (hasDetective) return buildDetectivePrompt(nodes, edges, instructions)

  const structure = buildBranches(nodes, edges)

  const styleInstructions = {
    synthese: `FORMAT DE RÉPONSE — Synthèse (Markdown strict) :
# Titre principal (déduit de la logique du graphe)
- **terme clé** : explication courte issue du graphe (5 à 7 points max)
Pas d'introduction générique. Pas de conclusion. Uniquement des bullets construits à partir des nodes et de leurs connexions.`,

    detaille: `FORMAT DE RÉPONSE — Analyse détaillée (Markdown strict) :
# Titre principal
## Une section H2 par branche ou scénario du graphe
Paragraphes développés suivant la logique des connexions. **Termes importants** en gras.
### Sous-sections si une branche a des ramifications
- listes pour les points clés
Construis des liens narratifs entre les branches plutôt que de les juxtaposer.`,

    reunion: `FORMAT DE RÉPONSE — Compte-rendu de réunion (Markdown strict) :
# Sujet principal (déduit du graphe)
## Une section H2 par branche ou point abordé
- **Décision** : ...
- **Action** : responsable + délai (si mentionné dans les nodes)
## Prochaines étapes
- liste des actions issues des branches terminales du graphe`,

    cours: `FORMAT DE RÉPONSE — Contenu pédagogique (Markdown strict) :
# Titre du cours (déduit du graphe)
## Introduction
Contexte et objectifs d'apprentissage issus des nodes racines.
## Une section H2 par concept ou branche
Explication claire suivant les connexions. **Termes clés** en gras.
### Exemple concret si le graphe en contient un
- points illustratifs
## Résumé
- **point essentiel** à retenir par branche`,
  }

  const instructionBlock = instructions.trim()
    ? `\nINSTRUCTIONS SPÉCIFIQUES (priorité absolue sur le format, pas sur les règles) :\n${instructions.trim()}\n`
    : ''

  return `${GRAPH_SYSTEM_RULES}
${instructionBlock}
Voici la structure du graphe de nodes (branches et connexions) :

${structure}

${styleInstructions[style]}

Réponds UNIQUEMENT en Markdown valide. Réponds en français.`
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

export interface PdfGraphResponse {
  nodes: Array<{ id: string; label: string; description: string; color: string }>
  edges: Array<{ source: string; target: string; label?: string }>
  error?: string
}

const PDF_COLORS = ['#6366f1', '#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6']

export async function generateGraphFromText(text: string): Promise<PdfGraphResponse> {
  const model = getOllamaModel()
  const truncated = text.length > 4000 ? text.slice(0, 4000) + '\n[...texte tronqué]' : text

  const prompt = `Analyse ce document et génère un graphe de concepts.

RÉPONDS UNIQUEMENT AVEC DU JSON BRUT. Aucun texte avant ni après. Aucun bloc markdown.

Format attendu (respecte-le exactement) :
{"nodes":[{"id":"1","label":"Concept","description":"description courte","color":"#6366f1"}],"edges":[{"source":"1","target":"2","label":"lien"}]}

Contraintes :
- 6 à 12 nodes, chacun représente un concept ou thème clé du document
- label : 1 à 4 mots
- description : 3 à 8 mots résumant le concept
- color : choisis parmi ces valeurs exactes : ${PDF_COLORS.join(', ')}
- edges : relie les concepts logiquement liés, source/target = id d'un node
- Les ids sont des chaînes "1", "2", etc.

Document à analyser :
${truncated}

JSON :`

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    })

    if (!response.ok) {
      if (response.status === 404) return { nodes: [], edges: [], error: `Modèle "${model}" non trouvé.` }
      return { nodes: [], edges: [], error: `Erreur Ollama (${response.status})` }
    }

    const json = await response.json()
    const raw = (json.response || '').trim()

    // Extract JSON block — model may add surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*"nodes"[\s\S]*"edges"[\s\S]*\}/)
    if (!jsonMatch) {
      return { nodes: [], edges: [], error: 'Le modèle n\'a pas renvoyé de JSON valide. Essayez mistral ou llama3.' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return { nodes: [], edges: [], error: 'Structure JSON invalide dans la réponse.' }
    }

    // Fallback colors if model skipped them
    parsed.nodes = parsed.nodes.map((n: any, i: number) => ({
      ...n,
      color: PDF_COLORS.includes(n.color) ? n.color : PDF_COLORS[i % PDF_COLORS.length],
    }))

    return { nodes: parsed.nodes, edges: parsed.edges }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Failed to fetch') || message.includes('ECONNREFUSED')) {
      return { nodes: [], edges: [], error: 'Ollama non connecté' }
    }
    if (message.includes('JSON')) {
      return { nodes: [], edges: [], error: 'Réponse non parseable. Réessayez ou utilisez un modèle plus capable.' }
    }
    return { nodes: [], edges: [], error: `Erreur : ${message}` }
  }
}
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
