export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface Chunk {
  materialId: number
  start: number
  end: number
  text: string
}

export function chunkTranscript(
  materialId: number,
  segments: TranscriptSegment[],
  targetSeconds: number = 60
): Chunk[] {
  const chunks: Chunk[] = []
  let currentSegments: TranscriptSegment[] = []
  let currentStart = 0
  let currentDuration = 0

  for (const seg of segments) {
    if (currentSegments.length === 0) {
      currentStart = seg.start
    }

    const segDuration = seg.end - seg.start
    if (currentDuration + segDuration > targetSeconds && currentSegments.length > 0) {
      chunks.push({
        materialId,
        start: currentStart,
        end: currentSegments[currentSegments.length - 1].end,
        text: currentSegments.map((s) => s.text).join(" ").trim(),
      })
      currentSegments = []
      currentDuration = 0
    }

    currentSegments.push(seg)
    currentDuration += segDuration
  }

  if (currentSegments.length > 0) {
    chunks.push({
      materialId,
      start: currentStart,
      end: currentSegments[currentSegments.length - 1].end,
      text: currentSegments.map((s) => s.text).join(" ").trim(),
    })
  }

  return chunks
}