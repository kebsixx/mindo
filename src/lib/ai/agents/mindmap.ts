import { chatCompletion } from "@/lib/ai/client"
import { MINDMAP_SCHEMA } from "@/lib/ai/schema"
import { z } from "zod"
import type { Provider } from "@/lib/ai/client"

const MindmapSchema = z.object({
  title: z.string(),
  children: z.array(
    z.object({
      label: z.string(),
      children: z.array(
        z.object({
          label: z.string(),
          children: z.array(
            z.object({
              label: z.string(),
            })
          ),
        })
      ),
    })
  ),
})

export type MindmapResult = z.infer<typeof MindmapSchema>

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
4. Balas hanya JSON sesuai skema.`

  const userPrompt = `Judul: ${summaryTitle}\n\nTranskrip:\n${transcriptText}`

  const schema = z.toJSONSchema(MINDMAP_SCHEMA)

  const raw = await chatCompletion(provider, apiKey, systemPrompt, userPrompt, schema, { temperature: 0 })

  const parsed = JSON.parse(raw)
  return MindmapSchema.parse(parsed)
}