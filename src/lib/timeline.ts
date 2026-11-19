// Aritmetika timeline gabungan. Semua waktu di sini absolut terhadap materi,
// bukan terhadap file sumber. Fungsi murni supaya bisa diuji tanpa IndexedDB.

import { chunkTranscript } from "./retrieval/chunk.ts"
import type { TranscriptSegment } from "@/lib/db"

export interface SourceTiming {
  id?: number
  order: number
  offset: number
  duration: number
}

export interface ChunkSlice {
  materialId: number
  start: number
  end: number
  text: string
  sourceId?: number
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/** 02:05 untuk di bawah satu jam, 1:02:05 untuk di atasnya. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`
}

/** Selalu berjam, dipakai berkas ekspor yang bisa berumur panjang. */
export function formatTimestamp(seconds: number): string {
  return formatClock(seconds)
}

export function sourceEnd(source: SourceTiming): number {
  return source.offset + Math.max(0, source.duration)
}

export function nextOffset(sources: SourceTiming[]): number {
  return sources.reduce((end, source) => Math.max(end, sourceEnd(source)), 0)
}

export function maxSegmentEnd(segments: Pick<TranscriptSegment, "end">[]): number {
  return segments.reduce((end, segment) => Math.max(end, segment.end), 0)
}

export function sourceLabel(order: number): string {
  return `Bagian ${order + 1}`
}

export function shiftSegment(
  segment: Pick<TranscriptSegment, "start" | "end" | "text">,
  offset: number,
  sourceId?: number,
): TranscriptSegment {
  return {
    start: segment.start + offset,
    end: segment.end + offset,
    text: segment.text,
    ...(sourceId === undefined ? {} : { sourceId }),
  }
}

export function resolveAt<T extends SourceTiming>(
  sources: T[],
  seconds: number,
): { source: T; local: number } | null {
  if (sources.length === 0) return null
  const sorted = [...sources].sort((a, b) => a.offset - b.offset)
  const at = Math.max(0, seconds)
  for (const source of sorted) {
    if (at < sourceEnd(source)) {
      return { source, local: Math.max(0, at - source.offset) }
    }
  }
  const last = sorted[sorted.length - 1]
  return { source: last, local: Math.max(0, at - last.offset) }
}

export function isOutputsStale(
  derivedSourceCount: number | undefined,
  sourceCount: number,
): boolean {
  return (
    typeof derivedSourceCount === "number" &&
    derivedSourceCount < sourceCount
  )
}

/**
 * Chunk dibuat per sumber supaya satu potongan tidak menyeberangi dua rekaman.
 * Waktu tetap absolut, jadi sitasi dan pencarian tidak perlu tahu asalnya.
 */
export function chunkBySource(
  materialId: number,
  segments: TranscriptSegment[],
  targetSeconds: number = 60,
): ChunkSlice[] {
  const groups = new Map<string, TranscriptSegment[]>()
  for (const segment of segments) {
    const key =
      segment.sourceId === undefined ? "legacy" : String(segment.sourceId)
    const group = groups.get(key)
    if (group) group.push(segment)
    else groups.set(key, [segment])
  }

  const out: ChunkSlice[] = []
  for (const [key, group] of groups) {
    const ordered = [...group].sort((a, b) => a.start - b.start)
    const chunks = chunkTranscript(materialId, ordered, targetSeconds)
    if (key === "legacy") {
      out.push(...chunks)
      continue
    }
    const sourceId = Number(key)
    out.push(...chunks.map((chunk) => ({ ...chunk, sourceId })))
  }
  return out
}
