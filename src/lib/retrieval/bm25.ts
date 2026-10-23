export interface ScoredChunk {
  chunk: { materialId: number; start: number; end: number; text: string }
  score: number
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

export function bm25Search(
  query: string,
  chunks: { materialId: number; start: number; end: number; text: string }[],
  k1: number = 1.5,
  b: number = 0.75,
  topK: number = 5
): ScoredChunk[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const N = chunks.length
  const avgDl = chunks.reduce((sum, c) => sum + tokenize(c.text).length, 0) / N

  const docFreq: Record<string, number> = {}
  const docTokens: string[][] = chunks.map((c) => tokenize(c.text))

  for (const tokens of docTokens) {
    const seen = new Set(tokens)
    for (const t of seen) {
      docFreq[t] = (docFreq[t] || 0) + 1
    }
  }

  const idf: Record<string, number> = {}
  for (const t of queryTokens) {
    idf[t] = Math.log((N - (docFreq[t] || 0) + 0.5) / ((docFreq[t] || 0) + 0.5) + 1)
  }

  const scores = chunks.map((chunk, i) => {
    const tokens = docTokens[i]
    const dl = tokens.length
    const tf: Record<string, number> = {}
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1
    }

    let score = 0
    for (const qt of queryTokens) {
      const f = tf[qt] || 0
      if (f === 0) continue
      const numerator = f * (k1 + 1)
      const denominator = f + k1 * (1 - b + b * (dl / avgDl))
      score += (idf[qt] || 0) * (numerator / denominator)
    }

    return { chunk, score }
  })

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}