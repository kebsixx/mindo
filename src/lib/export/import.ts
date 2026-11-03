import { strFromU8, unzipSync } from "fflate"
import { z } from "zod"
import { openDB } from "@/lib/db"
import type { MindmapNode } from "@/lib/db"

const nodeSchema: z.ZodType<MindmapNode> = z.lazy(() =>
  z.object({
    label: z.string(),
    children: z.array(nodeSchema),
  }),
)

const dataSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  materials: z.array(
    z.object({
      id: z.number().int(),
      title: z.string().catch("Materi tanpa judul"),
      createdAt: z.string().catch(() => new Date().toISOString()),
      duration: z.number().catch(0),
      status: z.string().catch("completed"),
      fileName: z.string().catch("audio"),
      fileSize: z.number().catch(0),
      audioType: z.string().optional(),
      audio: z.string().optional(),
    }),
  ),
  transcripts: z.array(
    z.object({
      materialId: z.number().int(),
      segments: z.array(
        z.object({ start: z.number(), end: z.number(), text: z.string() }),
      ),
    }),
  ),
  summaries: z.array(
    z.object({
      materialId: z.number().int(),
      title: z.string(),
      sections: z.array(
        z.object({
          heading: z.string(),
          points: z.array(z.string()),
          keyTerms: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
  mindmaps: z.array(
    z.object({
      materialId: z.number().int(),
      title: z.string(),
      children: z.array(nodeSchema),
    }),
  ),
  flashcards: z.array(
    z.object({
      materialId: z.number().int(),
      question: z.string(),
      answer: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
      timestampRef: z.number().catch(0),
      grade: z.enum(["unknown", "repeat", "known"]).catch("unknown"),
    }),
  ),
  chunks: z.array(
    z.object({
      materialId: z.number().int(),
      start: z.number(),
      end: z.number(),
      text: z.string(),
    }),
  ),
})

type ImportedData = z.infer<typeof dataSchema>

function dataUrlToBlob(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

function parseZip(buffer: ArrayBuffer): ImportedData {
  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(new Uint8Array(buffer))
  } catch {
    throw new Error("File tidak bisa dibuka sebagai .zip. Pastikan file hasil ekspor Mindo.")
  }

  // Finder/Explorer kadang menaruh file di subfolder, atau zip menyertakan
  // folder pembungkus. Cari namanya, bukan hanya di akar arsip.
  const key = Object.keys(entries).find(
    (name) => name === "mindo-data.json" || name.endsWith("/mindo-data.json"),
  )
  const raw = key ? entries[key] : undefined
  if (!raw) {
    throw new Error(
      "Arsip ini hanya berisi hasil (ringkasan, transkrip, flashcard, mindmap). Untuk pindah perangkat, ekspor ulang dengan mode “Pindah perangkat”.",
    )
  }

  let json: unknown
  try {
    json = JSON.parse(strFromU8(raw))
  } catch {
    throw new Error("Isi mindo-data.json rusak. Ekspor ulang dari Mindo lalu coba lagi.")
  }

  const parsed = dataSchema.safeParse(json)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue?.path.join(".") || "isi file"
    throw new Error(
      `Isi mindo-data.json tidak dikenali di bagian "${where}". Ekspor ulang memakai versi Mindo yang sama dengan pengimpor.`,
    )
  }
  return parsed.data
}

export async function importBundle(file: File): Promise<{ materials: number }> {
  const data = parseZip(await file.arrayBuffer())
  const db = openDB()

  await db.transaction(
    "rw",
    [
      db.materials,
      db.transcripts,
      db.summaries,
      db.mindmaps,
      db.flashcards,
      db.chunks,
    ],
    async () => {
      const idMap = new Map<number, number>()

      for (const item of data.materials) {
        const { id, audio, audioType, ...rest } = item
        const newId = await db.materials.add({
          ...rest,
          audio: audio
            ? dataUrlToBlob(audio, audioType || "audio/mpeg")
            : undefined,
        })
        idMap.set(id, newId)
      }

      const remap = (oldId: number) => idMap.get(oldId)

      for (const transcript of data.transcripts) {
        const materialId = remap(transcript.materialId)
        if (materialId) await db.transcripts.put({ ...transcript, materialId })
      }
      for (const summary of data.summaries) {
        const materialId = remap(summary.materialId)
        if (materialId) await db.summaries.put({ ...summary, materialId })
      }
      for (const mindmap of data.mindmaps) {
        const materialId = remap(mindmap.materialId)
        if (materialId) await db.mindmaps.put({ ...mindmap, materialId })
      }
      for (const card of data.flashcards) {
        const materialId = remap(card.materialId)
        if (materialId) await db.flashcards.add({ ...card, materialId })
      }
      for (const chunk of data.chunks) {
        const materialId = remap(chunk.materialId)
        if (materialId) await db.chunks.put({ ...chunk, materialId })
      }
    },
  )

  return { materials: data.materials.length }
}
