const OLLAMA_URL = 'http://localhost:11434'
const EMBED_MODEL = 'nomic-embed-text'
const CACHE_KEY = 'nodeorg-embeddings-v1'

interface EmbeddingCache {
  embeddings: Record<string, number[]>
}

function loadCache(): Record<string, number[]> {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return {}
    return (JSON.parse(stored) as EmbeddingCache).embeddings || {}
  } catch {
    return {}
  }
}

function saveCache(embeddings: Record<string, number[]>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ embeddings }))
  } catch { /* storage full — silently skip */ }
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.embedding || null
  } catch {
    return null
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

let _embeddings: Record<string, number[]> = {}
let _ready = false
let _building = false

export function isEmbeddingReady() { return _ready }

export async function buildEmbeddingIndex(items: { key: string; text: string }[]): Promise<void> {
  if (_building) return
  _building = true

  _embeddings = loadCache()

  const missing = items.filter((it) => !_embeddings[it.key])

  if (missing.length === 0) {
    _ready = true
    _building = false
    return
  }

  // Check if nomic-embed-text is available
  const test = await getEmbedding('test')
  if (!test) {
    _building = false
    return
  }

  for (const { key, text } of missing) {
    const emb = await getEmbedding(text)
    if (emb) _embeddings[key] = emb
  }

  saveCache(_embeddings)
  _ready = true
  _building = false
}

export async function semanticSearch(
  query: string,
  keys: string[],
  topK = 5,
  threshold = 0.3
): Promise<Set<string>> {
  if (!_ready) return new Set()

  const queryEmb = await getEmbedding(query)
  if (!queryEmb) return new Set()

  const scored = keys
    .filter((k) => _embeddings[k])
    .map((k) => ({ key: k, score: cosineSimilarity(queryEmb, _embeddings[k]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > threshold)

  return new Set(scored.map((r) => r.key))
}
