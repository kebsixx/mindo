import { transcribeAudio } from "@/lib/ai/client"
import { openDB } from "@/lib/db"
import type { Provider } from "@/lib/ai/client"

export async function transcribe(
  provider: Provider,
  apiKey: string,
  file: Blob,
  onProgress?: (progress: number) => void
) {
  const result = await transcribeAudio(provider, apiKey, file, onProgress)

  const segments = result.segments
    .filter((s) => s.text.trim().length > 0)
    .filter((s) => s.end >= s.start)

  return {
    text: result.text,
    segments,
    duration: result.duration,
  }
}