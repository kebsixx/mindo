import {
  openDB,
  type AudioSource,
  type Material,
  type SourceStatus,
  type TranscriptSegment,
} from "@/lib/db"
import {
  chunkBySource,
  maxSegmentEnd,
  nextOffset,
  shiftSegment,
} from "@/lib/timeline"

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export async function listSources(materialId: number): Promise<AudioSource[]> {
  return openDB()
    .sources.where("materialId")
    .equals(materialId)
    .sortBy("order")
}

function legacySource(material: Material, segments: TranscriptSegment[]): AudioSource {
  const duration =
    material.duration ||
    (segments.length ? Math.max(...segments.map((segment) => segment.end)) : 0)
  return {
    materialId: material.id!,
    order: 0,
    fileName: material.fileName || material.title || "rekaman",
    fileSize: material.fileSize || material.audio?.size || 0,
    duration,
    offset: 0,
    status: segments.length > 0 ? "done" : "pending",
    audio: material.audio,
    createdAt: material.createdAt,
  }
}

/**
 * Materi lama belum punya baris sumber. Baris dibuat malas saat pertama kali
 * dibutuhkan, dan blob audio lama tidak dipindahkan supaya upgrade tidak bisa
 * merusak rekaman yang sudah ada.
 */
export async function ensureSources(materialId: number): Promise<AudioSource[]> {
  const db = openDB()
  const existing = await listSources(materialId)
  if (existing.length > 0) return existing

  const material = await db.materials.get(materialId)
  if (!material) return []
  const transcript = await db.transcripts.get(materialId)
  const segments = transcript?.segments ?? []
  if (!material.audio && segments.length === 0) return []

  await db.transaction(
    "rw",
    [db.materials, db.sources, db.transcripts, db.chunks],
    async () => {
      const raced = await db.sources
        .where("materialId")
        .equals(materialId)
        .count()
      if (raced > 0) return

      const id = await db.sources.add(legacySource(material, segments))
      if (segments.some((segment) => segment.sourceId === undefined)) {
        await db.transcripts.put({
          materialId,
          segments: segments.map((segment) =>
            segment.sourceId === undefined ? { ...segment, sourceId: id } : segment,
          ),
        })
      }

      const chunks = await db.chunks
        .where("materialId")
        .equals(materialId)
        .toArray()
      if (chunks.some((chunk) => chunk.sourceId === undefined)) {
        await db.chunks.bulkPut(
          chunks.map((chunk) =>
            chunk.sourceId === undefined ? { ...chunk, sourceId: id } : chunk,
          ),
        )
      }
    },
  )

  return listSources(materialId)
}

export async function countSources(materialId: number): Promise<number> {
  return openDB().sources.where("materialId").equals(materialId).count()
}

export async function transcriptText(materialId: number): Promise<string> {
  const transcript = await openDB().transcripts.get(materialId)
  return (
    transcript?.segments
      .map((segment) => segment.text)
      .join(" ")
      .trim() ?? ""
  )
}

export async function createSourceFromFile(
  materialId: number,
  file: File,
): Promise<number> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error("File lebih dari 25 MB. Kompres dulu atau rekam langsung dari browser.")
  }
  if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
    throw new Error("Pilih berkas audio atau video MP4.")
  }

  const db = openDB()
  return db.transaction(
    "rw",
    [db.materials, db.sources],
    async () => {
      const material = await db.materials.get(materialId)
      if (!material) throw new Error("Materi tidak ditemukan di perangkat ini.")

      const sources = await db.sources
        .where("materialId")
        .equals(materialId)
        .sortBy("order")
      const id = await db.sources.add({
        materialId,
        order: sources.length,
        fileName: file.name,
        fileSize: file.size,
        duration: 0,
        offset: nextOffset(sources),
        status: "pending",
        audio: file,
        createdAt: new Date().toISOString(),
      })
      await db.materials.update(materialId, {
        fileSize: (material.fileSize || 0) + file.size,
      })
      return id
    },
  )
}

export async function markSourceStatus(
  sourceId: number,
  status: SourceStatus,
): Promise<void> {
  await openDB().sources.update(sourceId, { status })
}

/**
 * Tulis hasil transkripsi satu sumber ke timeline materi. Segmen milik sumber
 * itu diganti, bukan ditambah, jadi mencoba ulang tidak menggandakan teks.
 */
export async function saveSourceTranscription(
  materialId: number,
  sourceId: number,
  segments: TranscriptSegment[],
  duration: number,
): Promise<void> {
  const db = openDB()
  await db.transaction(
    "rw",
    [db.materials, db.sources, db.transcripts, db.chunks],
    async () => {
      const source = await db.sources.get(sourceId)
      if (!source || source.materialId !== materialId) {
        throw new Error("Sumber rekaman tidak ditemukan.")
      }
      const transcript = await db.transcripts.get(materialId)
      const absolute = segments.map((segment) =>
        shiftSegment(segment, source.offset, sourceId),
      )
      const others = (transcript?.segments ?? []).filter(
        (segment) => segment.sourceId !== sourceId,
      )
      const merged = [...others, ...absolute].sort((a, b) => a.start - b.start)
      const effectiveDuration = Math.max(
        duration,
        maxSegmentEnd(absolute) - source.offset,
      )

      await db.transcripts.put({ materialId, segments: merged })
      await db.chunks.where("materialId").equals(materialId).delete()
      await db.chunks.bulkPut(chunkBySource(materialId, merged))
      await db.sources.update(sourceId, {
        duration: effectiveDuration,
        status: "done",
      })

      const sources = await db.sources
        .where("materialId")
        .equals(materialId)
        .toArray()
      const total = Math.max(
        nextOffset(sources),
        maxSegmentEnd(merged),
      )
      await db.materials.update(materialId, {
        duration: Math.round(total),
        status: "processing",
      })
    },
  )
}

export async function rebuildChunks(materialId: number): Promise<void> {
  const db = openDB()
  const transcript = await db.transcripts.get(materialId)
  await db.chunks.where("materialId").equals(materialId).delete()
  if (transcript?.segments.length) {
    await db.chunks.bulkPut(chunkBySource(materialId, transcript.segments))
  }
}

export interface MergeResult {
  materialId: number
  title: string
}

/**
 * Gabungkan beberapa materi menjadi satu materi baru. Transkrip disalin dengan
 * offset, audio tidak di-decode ulang, dan materi asal tidak diubah.
 */
export async function mergeMaterials(
  materialIds: number[],
  title: string,
): Promise<MergeResult> {
  const ids = [...new Set(materialIds)]
  if (ids.length < 2) throw new Error("Pilih minimal dua materi untuk digabung.")

  const db = openDB()
  const materials = await db.materials.bulkGet(ids)
  if (materials.some((material) => !material)) {
    throw new Error("Salah satu materi tidak ditemukan. Muat ulang halaman lalu coba lagi.")
  }

  const plans: {
    material: Material
    sources: AudioSource[]
    segments: TranscriptSegment[]
  }[] = []

  for (const material of materials as Material[]) {
    const sources = await ensureSources(material.id!)
    const transcript = await db.transcripts.get(material.id!)
    if (!transcript || transcript.segments.length === 0) {
      throw new Error(
        `"${material.title}" belum punya transkrip. Selesaikan pemrosesannya dulu.`,
      )
    }
    const unfinished = sources.find((source) => source.status !== "done")
    if (unfinished) {
      throw new Error(
        `"${material.title}" masih punya bagian yang belum selesai. Buka Pemrosesan dan coba lagi.`,
      )
    }
    plans.push({ material, sources, segments: transcript.segments })
  }

  const mergedTitle =
    title.trim().slice(0, 100) ||
    `Gabungan ${plans.length} rekaman`
  const now = new Date().toISOString()
  const totalSize = plans.reduce(
    (size, plan) => size + (plan.material.fileSize || 0),
    0,
  )

  return db.transaction(
    "rw",
    [db.materials, db.sources, db.transcripts, db.chunks],
    async () => {
      const newId = await db.materials.add({
        title: mergedTitle,
        createdAt: now,
        duration: 0,
        status: "pending",
        fileName: `gabungan-${plans.length}-rekaman`,
        fileSize: totalSize,
        derivedSourceCount: 0,
      })

      const segments: TranscriptSegment[] = []
      let cursor = 0
      let order = 0

      for (const plan of plans) {
        for (const source of plan.sources) {
          const owned = plan.segments.filter((segment) => {
            if (segment.sourceId !== undefined) {
              return segment.sourceId === source.id
            }
            // Transkrip lama belum punya sourceId dan hanya punya satu sumber.
            return source.order === 0
          })
          const localEnd = Math.max(
            source.duration,
            owned.length
              ? Math.max(...owned.map((segment) => segment.end - source.offset))
              : 0,
          )
          const sourceId = await db.sources.add({
            materialId: newId,
            order,
            fileName: source.fileName,
            fileSize: source.fileSize,
            duration: localEnd,
            offset: cursor,
            status: "done",
            audio: source.audio,
            createdAt: source.createdAt || now,
          })

          for (const segment of owned) {
            segments.push({
              ...segment,
              start: cursor + (segment.start - source.offset),
              end: cursor + (segment.end - source.offset),
              sourceId,
            })
          }

          cursor += localEnd
          order += 1
        }
      }

      segments.sort((a, b) => a.start - b.start)
      await db.transcripts.put({ materialId: newId, segments })
      await db.chunks.bulkPut(chunkBySource(newId, segments))
      await db.materials.update(newId, { duration: Math.round(cursor) })

      return { materialId: newId, title: mergedTitle }
    },
  )
}
