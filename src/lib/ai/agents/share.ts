import { chatCompletionParsed } from "@/lib/ai/client"
import { SHARE_SCHEMA } from "@/lib/ai/schema"
import { z } from "zod"
import type { Provider } from "@/lib/ai/client"
import { sanitizeShareText } from "@/lib/share/links"

const ShareDraftSchema = z.object({
  message: z.string(),
})

export type ShareDraftResult = z.infer<typeof ShareDraftSchema>

export async function composeShareMessage(
  provider: Provider,
  apiKey: string,
  options: {
    title: string
    summaryText: string
    tone?: "casual" | "formal"
  }
): Promise<string> {
  const { title, summaryText, tone = "casual" } = options

  const toneInstruction =
    tone === "formal"
      ? "Gaya bahasa formal, sopan, cocok untuk dibagikan ke forum kelas atau rekan kelompok tugas."
      : "Gaya bahasa santai, ramah, akrab, cocok untuk chat WhatsApp teman sekelas."

  const systemPrompt = `Kamu adalah asisten mahasiswa yang menyusun pesan singkat WhatsApp untuk membagikan rangkuman materi kuliah ke teman sekelas.
Aturan:
1. Pesan harus ringkas, jelas, langsung ke poin (sekitar 300 sampai 700 karakter, jangan lebih dari 1000 karakter).
2. Tuliskan salam pembuka ramah, judul materi, 2 sampai 4 poin bahasan inti, lalu beri tahu bahwa ringkasan lengkap atau peta konsep ada di lampiran.
3. ${toneInstruction}
4. Jangan gunakan em dash (—). Gunakan strip biasa (-) jika butuh tanda hubung atau poin.
5. Format teks ramah WhatsApp (gunakan bintang untuk tebal jika perlu, jangan Markdown heading seperti ##).
6. Balas hanya JSON sesuai skema.`

  const userPrompt = `Judul Materi: ${title}

Rangkuman Materi:
${summaryText.slice(0, 4000)}`

  const schema = z.toJSONSchema(SHARE_SCHEMA)

  const res = await chatCompletionParsed(
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    schema,
    (raw) => ShareDraftSchema.parse(JSON.parse(raw)),
    { temperature: 0 }
  )

  return sanitizeShareText(res.message)
}
