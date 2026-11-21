import { strToU8, zip } from "fflate"
import { openDB } from "@/lib/db"
import type {
  Chunk,
  Flashcard,
  Material,
  Mindmap,
  Summary,
  Transcript,
} from "@/lib/db"
import { ensureSources } from "@/lib/sources"
import { flashcardsToCsv, summaryToMarkdown, transcriptToText } from "./markdown"
import { mindmapToPng } from "./mindmap"

export interface BundleOptions {
  materialIds: number[]
  portable: boolean
  includeAudio: boolean
}

export interface BundleResult {
  blob: Blob
  filename: string
  bytes: number
}

export interface PortableSource {
  id: number
  materialId: number
  order: number
  fileName: string
  fileSize: number
  duration: number
  offset: number
  status: string
  createdAt: string
  audioType?: string
  audio?: string
}

export interface PortableData {
  version: 2
  exportedAt: string
  materials: (Omit<Material, "audio"> & {
    id: number
    audioType?: string
    audio?: string
  })[]
  sources: PortableSource[]
  transcripts: Transcript[]
  summaries: Summary[]
  mindmaps: Mindmap[]
  flashcards: Omit<Flashcard, "id">[]
  chunks: Chunk[]
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "materi"
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function zipFiles(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (err, data) =>
      err ? reject(err) : resolve(data),
    )
  })
}

export async function exportBundle({
  materialIds,
  portable,
  includeAudio,
}: BundleOptions): Promise<BundleResult> {
  const db = openDB()
  const files: Record<string, Uint8Array> = {}
  const folders = new Set<string>()
  const dump: PortableData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    materials: [],
    sources: [],
    transcripts: [],
    summaries: [],
    mindmaps: [],
    flashcards: [],
    chunks: [],
  }

  for (const id of materialIds) {
    // Materi lama belum punya baris sumber; lengkapi dulu supaya arsip baru
    // tetap bisa memutar audio per bagian.
    await ensureSources(id)
    const [material, transcript, summary, mindmap, flashcards, chunks, sources] =
      await Promise.all([
        db.materials.get(id),
        db.transcripts.get(id),
        db.summaries.get(id),
        db.mindmaps.get(id),
        db.flashcards.where("materialId").equals(id).toArray(),
        db.chunks.where("materialId").equals(id).toArray(),
        db.sources.where("materialId").equals(id).sortBy("order"),
      ])
    if (!material) continue

    let folder = slugify(material.title)
    if (folders.has(folder)) folder = `${folder}-${id}`
    folders.add(folder)

    if (summary) {
      files[`${folder}/ringkasan.md`] = strToU8(summaryToMarkdown(summary))
      dump.summaries.push(summary)
    }
    if (transcript?.segments.length) {
      files[`${folder}/transkrip.txt`] = strToU8(
        transcriptToText(transcript.segments, sources),
      )
      dump.transcripts.push(transcript)
    }
    if (flashcards.length) {
      files[`${folder}/flashcard.csv`] = strToU8(flashcardsToCsv(flashcards))
      dump.flashcards.push(
        ...flashcards.map((card) => ({
          materialId: card.materialId,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty,
          timestampRef: card.timestampRef,
          grade: card.grade,
        })),
      )
    }
    if (mindmap) {
      const png = await mindmapToPng(JSON.stringify(mindmap))
      files[`${folder}/mindmap.png`] = new Uint8Array(
        await png.arrayBuffer(),
      )
      dump.mindmaps.push(mindmap)
    }

    if (portable) {
      const { audio, ...rest } = material
      // Audio ikut di tiap sumber; materi tidak menyimpan salinan kedua.
      void audio
      dump.materials.push({ ...rest, id })
      for (const source of sources) {
        if (!source.id) continue
        const { audio, ...sourceRest } = source
        dump.sources.push({
          ...sourceRest,
          id: source.id,
          audioType: audio?.type || undefined,
          audio:
            includeAudio && audio ? await blobToBase64(audio) : undefined,
        })
      }
      dump.chunks.push(...chunks)
    }
  }

  if (portable) {
    files["mindo-data.json"] = strToU8(JSON.stringify(dump))
  }

  const zipped = await zipFiles(files)
  const filename =
    materialIds.length > 1
      ? `mindo-${folders.size}-materi.zip`
      : `mindo-${[...folders][0] ?? "materi"}.zip`

  return {
    blob: new Blob([new Uint8Array(zipped)], { type: "application/zip" }),
    filename,
    bytes: zipped.byteLength,
  }
}

// Perkiraan kasar untuk ditampilkan sebelum unduh: teks hasil ringkas, PNG
// mindmap, dan audio (base64 membengkak ~33%) kalau ikut disertakan.
export async function estimateBytes(
  materialIds: number[],
  portable: boolean,
  includeAudio: boolean,
): Promise<number> {
  const db = openDB()
  const materials = await db.materials.bulkGet(materialIds)
  let bytes = materialIds.length * 40 * 1024
  if (!portable) return bytes
  bytes += 48 * 1024
  if (includeAudio) {
    const sources = await db.sources
      .where("materialId")
      .anyOf(materialIds)
      .toArray()
    for (const source of sources) {
      bytes += Math.ceil(((source.audio?.size ?? 0) * 4) / 3)
    }
    // Materi lama tanpa baris sumber masih menyimpan audio di materinya.
    for (const material of materials) {
      bytes += Math.ceil(((material?.audio?.size ?? 0) * 4) / 3)
    }
  }
  return bytes
}
