import type { Node } from '@xyflow/react'

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

export type OllamaStyle = 'concis' | 'structure' | 'detaille'

function buildPromptFromNodes(nodes: Node[], style: OllamaStyle = 'concis'): string {
  if (nodes.length === 0) {
    return 'Aucun nœud sur le canvas.'
  }

  const sections = nodes.map((node) => {
    const d = node.data as { label?: string; description?: string; category?: string }
    const label = d.label || 'Sans titre'
    const desc = d.description || ''
    const cat = d.category || ''
    let line = `- ${label}`
    if (cat) line += ` [${cat}]`
    if (desc) line += ` : ${desc}`
    return line
  })

  const styleInstructions = {
    concis: `Réponds en bullet points uniquement. Maximum 5-7 points courts. Sois direct et actionnable. Pas d'introduction ni de conclusion.`,
    structure: `Réponds avec des titres et sous-points. Structure claire en sections. Pas de longs paragraphes.`,
    detaille: `Développe en paragraphes complets. Crée des liens narratifs entre les éléments. Propose des idées pour enrichir.`,
  }

  return `Tu es un assistant professionnel. À partir de ces éléments de canvas :

${sections.join('\n')}

${styleInstructions[style]}

Réponds en français.`
}

export interface OllamaResponse {
  text: string
  error?: string
}

export async function generateFromNodes(
  nodes: Node[],
  onToken?: (token: string) => void,
  style: OllamaStyle = 'concis'
): Promise<OllamaResponse> {
  const prompt = buildPromptFromNodes(nodes, style)
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
