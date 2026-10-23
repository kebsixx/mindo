import { chatCompletion } from "@/lib/ai/client"
import { TUTOR_SCHEMA } from "@/lib/ai/schema"
import { z } from "zod"
import { bm25Search } from "@/lib/retrieval/bm25"
import type { Provider } from "@/lib/ai/client"

const TutorSchema = z.object({
  found: z.boolean(),
  answer: z.string(),
  citations: z.array(z.number()),
})

export type TutorResult = z.infer<typeof TutorSchema>

export async function tutor(
  provider: Provider,
  apiKey: string,
  question: string,
  chunks: { materialId: number; start: number; end: number; text: string }[]
): Promise<TutorResult> {
  const results = bm25Search(question, chunks, 1.5, 0.75, 5)

  if (results.length === 0 || results[0].score < 0.5) {
    return {
      found: false,
      answer: "Maaf, topik tersebut tidak dibahas dalam rekaman ini.",
      citations: [],
    }
  }

  const contextChunks = results.flatMap((r) => {
    const idx = chunks.findIndex((c) => c.start === r.chunk.start)
    const prev = idx > 0 ? chunks[idx - 1] : null
    const next = idx < chunks.length - 1 ? chunks[idx + 1] : null
    return [prev, r.chunk, next].filter(Boolean)
  })

  const contextText = contextChunks
    .map((c) => `[${Math.floor(c.start / 60)}:${String(Math.floor(c.start % 60)).padStart(2, "0")}] ${c.text}`)
    .join("\n")

  const systemPrompt = `Kamu adalah tutor untuk satu rekaman kuliah. Kamu hanya boleh memakai konteks yang diberikan.
Aturan:
1. Kalau konteks tidak memuat jawabannya, isi found dengan false dan answer dengan satu kalimat yang menyatakan topik itu tidak dibahas di rekaman.
2. Kalau konteks memuat jawabannya, jawab ringkas tapi lengkap. Sertakan kutipan singkat dari transkrip.
3. Isi citations dengan detik yang sesuai dengan bagian yang kamu pakai.
4. Jangan memakai pengetahuan di luar konteks. Kalau kamu merasa perlu, itu tanda konteksnya kurang.
5. Balas hanya JSON sesuai skema.`

  const userPrompt = `Konteks:\n${contextText}\n\nPertanyaan: ${question}`

  const schema = z.toJSONSchema(TUTOR_SCHEMA)

  const raw = await chatCompletion(provider, apiKey, systemPrompt, userPrompt, schema, { temperature: 0.3 })

  const parsed = JSON.parse(raw)
  return TutorSchema.parse(parsed)
}