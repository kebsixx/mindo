import { transcribeAudio } from "@/lib/ai/client"
import type { Provider } from "@/lib/ai/client"

export async function transcribe(
  provider: Provider,
  apiKey: string,
  file: Blob
) {
  const result = await transcribeAudio(provider, apiKey, file)

  const segments = result.segments
    .filter((s) => s.text.trim().length > 0)
    .filter((s) => s.end >= s.start)

  return {
    text: result.text,
    segments,
    duration: result.duration,
  }
}