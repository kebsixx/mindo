import { openDB } from "@/lib/db"
import { summarize } from "@/lib/ai/agents/summarize"
import { mindmap } from "@/lib/ai/agents/mindmap"
import { flashcard } from "@/lib/ai/agents/flashcard"
import type { Provider } from "@/lib/ai/client"

// Satu tempat menulis hasil agen, dipakai halaman Pemrosesan dan tab Materi
// yang mencoba ulang. Kalau keduanya menulis sendiri, bentuk datanya bisa beda.

export async function runSummary(
  materialId: number,
  provider: Provider,
  apiKey: string,
  text: string
): Promise<void> {
  const result = await summarize(provider, apiKey, text)
  await openDB().summaries.put({
    materialId,
    title: result.title,
    sections: result.sections,
  })
}

export async function runMindmap(
  materialId: number,
  provider: Provider,
  apiKey: string,
  text: string,
  title: string
): Promise<void> {
  const result = await mindmap(provider, apiKey, text, title)
  await openDB().mindmaps.put({
    materialId,
    title: result.title,
    children: result.children,
  })
}

export async function runFlashcards(
  materialId: number,
  provider: Provider,
  apiKey: string,
  text: string,
  title: string
): Promise<void> {
  const result = await flashcard(provider, apiKey, text, title)
  const db = openDB()
  await db.flashcards.where("materialId").equals(materialId).delete()
  await db.flashcards.bulkAdd(
    result.cards.map((c) => ({
      materialId,
      question: c.question,
      answer: c.answer,
      difficulty: c.difficulty,
      timestampRef: c.timestampRef,
      grade: "unknown" as const,
    }))
  )
}
