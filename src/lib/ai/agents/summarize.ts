import { chatCompletion } from "@/lib/ai/client"
import { SUMMARY_SCHEMA } from "@/lib/ai/schema"
import { z } from "zod"
import type { Provider } from "@/lib/ai/client"

const SummarySchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      points: z.array(z.string()),
      keyTerms: z.array(z.string()).optional(),
    })
  ),
})

export type SummaryResult = z.infer<typeof SummarySchema>

export async function summarize(
  provider: Provider,
  apiKey: string,
  transcriptText: string
): Promise<SummaryResult> {
  const systemPrompt = `Kamu adalah analis materi kuliah. Sumber tunggalmu adalah teks transkrip di bawah.
Aturan:
1. Jangan menambahkan informasi yang tidak ada di transkrip.
2. Kalau sebuah bagian tidak menjelaskan sub-topik apa pun, jangan sertakan.
3. Tulis poin sebagai kalimat lengkap, bukan frasa kunci.
4. keyTerms berisi istilah dari materi, bukan istilah umum seperti "materi" atau "pembahasan".
5. Buat 5 sampai 10 bagian, mengikuti urutan pembahasan di rekaman.
6. Balas hanya JSON sesuai skema.`

  const userPrompt = `Transkrip:\n${transcriptText}`

  const schema = z.toJSONSchema(SUMMARY_SCHEMA)

  const raw = await chatCompletion(provider, apiKey, systemPrompt, userPrompt, schema, { temperature: 0 })

  const parsed = JSON.parse(raw)
  return SummarySchema.parse(parsed)
}