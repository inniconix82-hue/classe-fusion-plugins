import type { Node } from '@xyflow/react'

const OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'mistral'

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
