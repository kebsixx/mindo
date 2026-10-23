import { chatCompletion } from "@/lib/ai/client"
import { FLASHCARD_SCHEMA } from "@/lib/ai/schema"
import { z } from "zod"
import type { Provider } from "@/lib/ai/client"

const FlashcardSchema = z.object({
  cards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      timestampRef: z.number(),
    })
  ),
})

export type FlashcardResult = z.infer<typeof FlashcardSchema>

export async function flashcard(
  provider: Provider,
  apiKey: string,
  transcriptText: string,
  summaryTitle: string
): Promise<FlashcardResult> {
  const systemPrompt = `Buat flashcard dari materi ini.
Aturan:
1. Satu kartu satu konsep. Jangan menggabung dua topik dalam satu pertanyaan.
2. Pertanyaan harus bisa dijawab dari materi, bukan dari cerita pribadi atau opini.
3. Jawaban maksimal dua kalimat.
4. difficulty easy untuk definisi, medium untuk hubungan antar konsep, hard untuk rumus, pembeda, atau kasus.
5. Isi timestampRef dengan detik saat konsep itu dibahas.
6. Pastikan tiap sub-topik dalam ringkasan punya minimal satu kartu.
7. Balas hanya JSON sesuai skema.`

  const userPrompt = `Judul: ${summaryTitle}\n\nTranskrip:\n${transcriptText}`

  const schema = z.toJSONSchema(FLASHCARD_SCHEMA)

  const raw = await chatCompletion(provider, apiKey, systemPrompt, userPrompt, schema, { temperature: 0 })

  const parsed = JSON.parse(raw)
  return FlashcardSchema.parse(parsed)
}