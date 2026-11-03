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

const GLOBAL_INTENT =
  /\b(poin utama|poin penting|ringkas|ringkasan|kesimpulan|gambaran|secara umum|istilah|kata sulit|paling sulit|bagian akhir|bagian awal|topik utama|inti)\b/i

/** Ambil chunk tersebar merata agar pertanyaan menyeluruh melihat seluruh rekaman. */
function spreadChunks<T>(chunks: T[], max: number): T[] {
  if (chunks.length <= max) return chunks
  const step = (chunks.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => chunks[Math.round(i * step)])
}

export async function tutor(
  provider: Provider,
  apiKey: string,
  question: string,
  chunks: { materialId: number; start: number; end: number; text: string }[]
): Promise<TutorResult> {
  if (chunks.length === 0) {
    return {
      found: false,
      answer: "Transkrip rekaman ini belum tersedia.",
      citations: [],
    }
  }

  const global = GLOBAL_INTENT.test(question)
  const results = global ? [] : bm25Search(question, chunks, 1.5, 0.75, 5)
  const weak = results.length === 0 || results[0].score < 0.5

  // Pertanyaan menyeluruh ("poin utama", "istilah tersulit", "bagian akhir")
  // tidak punya istilah literal untuk dicocokkan BM25. Kirim konteks tersebar
  // dan biarkan model yang menilai, bukan skor pencarian.
  const contextChunks = global || weak
    ? spreadChunks(chunks, 12)
    : results.flatMap((r) => {
        const idx = chunks.findIndex((c) => c.start === r.chunk.start)
        const prev = idx > 0 ? chunks[idx - 1] : null
        const next = idx < chunks.length - 1 ? chunks[idx + 1] : null
        return [prev, r.chunk, next].filter(
          (c): c is (typeof chunks)[number] => c !== null,
        )
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
5. Pertanyaan menyeluruh tetap dijawab dari konteks: "poin utama" berarti rangkum gagasan terpenting, "istilah paling sulit" berarti sebut istilah teknis di konteks lalu jelaskan, "bagian akhir" berarti fokus ke chunk dengan detik terbesar. Jangan menolak pertanyaan seperti ini selama konteks berisi materi.
6. Balas hanya JSON sesuai skema.`

  const userPrompt = `Konteks:\n${contextText}\n\nPertanyaan: ${question}`

  const schema = z.toJSONSchema(TUTOR_SCHEMA)

  const raw = await chatCompletion(provider, apiKey, systemPrompt, userPrompt, schema, { temperature: 0.3 })

  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
  try {
    return TutorSchema.parse(JSON.parse(cleaned))
  } catch {
    // Model kadang membalas teks biasa. Jawaban tetap berguna, jadi pakai apa adanya.
    return { found: true, answer: cleaned, citations: [] }
  }
}