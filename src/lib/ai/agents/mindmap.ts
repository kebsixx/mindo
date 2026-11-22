import { chatCompletionParsed, parseModelJson } from "@/lib/ai/client"
import { MINDMAP_SCHEMA } from "@/lib/ai/schema"
import { normalizeMindmap } from "@/lib/mindmap"
import { z } from "zod"
import type { MindmapTree } from "@/lib/mindmap"
import type { Provider } from "@/lib/ai/client"

export type MindmapResult = MindmapTree

export async function mindmap(
  provider: Provider,
  apiKey: string,
  transcriptText: string,
  summaryTitle: string
): Promise<MindmapResult> {
  const systemPrompt = `Kamu adalah pembuat peta konsep. Buat hierarki dari materi kuliah.
Aturan:
1. Maksimal 3 level kedalaman.
2. Buat 4 sampai 8 cabang utama yang mengikuti urutan pembahasan di rekaman.
3. Setiap label singkat dan jelas.
4. Satu sub-cabang boleh punya maksimal 8 anak.
5. Balas hanya JSON sesuai skema.`

  const userPrompt = `Judul: ${summaryTitle}\n\nTranskrip:\n${transcriptText}`

  const schema = z.toJSONSchema(MINDMAP_SCHEMA)

  return chatCompletionParsed(
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    schema,
    (raw) => normalizeMindmap(parseModelJson(raw)),
    { temperature: 0 }
  )
}
