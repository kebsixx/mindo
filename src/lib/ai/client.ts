import { PROVIDERS } from "./providers"
import type { Provider } from "./providers"

export type { Provider } from "./providers"

function authHeaders(provider: Provider, apiKey: string): Record<string, string> {
  const key = apiKey.trim()
  if (!key || PROVIDERS[provider].keyless) return {}
  return { Authorization: `Bearer ${key}` }
}

const AUDIO_MIME: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  wav: "audio/wav",
  flac: "audio/flac",
}

function extensionFor(blob: Blob): string {
  const type = blob.type.toLowerCase()
  const byType = Object.keys(AUDIO_MIME).find((ext) => AUDIO_MIME[ext] === type)
  if (byType) return byType
  const byName = (blob as File).name?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  if (byName && AUDIO_MIME[byName]) return byName
  return "webm"
}

// Whisper menolak file tanpa nama atau ekstensi, dan Safari kadang memberi MIME
// kosong untuk mp3. Kirim sebagai File bernama dengan tipe yang dikenali provider.
export function toProviderAudio(blob: Blob): File {
  if (blob instanceof File && blob.type && blob.name.includes(".")) return blob
  const ext = extensionFor(blob)
  return new File([blob], `audio.${ext}`, {
    type: blob.type || AUDIO_MIME[ext],
  })
}

export async function transcribeAudio(
  provider: Provider,
  apiKey: string,
  file: Blob
): Promise<{ text: string; segments: { id: number; start: number; end: number; text: string }[]; duration: number }> {
  const info = PROVIDERS[provider]
  if (!info.stt) {
    throw new Error(
      `${info.label} belum mendukung transkripsi audio. Pilih Groq atau OpenAI di Pengaturan.`
    )
  }

  const formData = new FormData()
  formData.append("file", toProviderAudio(file))
  formData.append("model", info.stt)
  formData.append("language", "id")
  formData.append("response_format", "verbose_json")
  formData.append("timestamp_granularities[]", "segment")
  formData.append("temperature", "0")

  const res = await fetch(`${info.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: authHeaders(provider, apiKey),
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status} ${err.slice(0, 300)}`)
  }

  return res.json()
}

function stripSchemaMeta(schema: Record<string, unknown>): Record<string, unknown> {
  // Groq menolak kunci $schema di dalam json_schema.
  const rest = { ...schema }
  delete rest.$schema
  return rest
}

export async function chatCompletion(
  provider: Provider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  schema?: Record<string, unknown>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const info = PROVIDERS[provider]

  const body: Record<string, unknown> = {
    model: info.llm,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0,
  }

  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens
  }

  const send = async (withSchema: boolean) => {
    const payload = { ...body }
    if (withSchema && schema) {
      payload.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          strict: true,
          schema: stripSchemaMeta(schema),
        },
      }
    }
    return fetch(`${info.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(provider, apiKey),
      },
      body: JSON.stringify(payload),
    })
  }

  let useSchema = Boolean(schema)
  let res = await send(useSchema)

  // Sebagian model/akun menolak structured output. Ulangi tanpa itu; prompt
  // semua agen sudah meminta JSON murni, jadi hasilnya tetap bisa diparse.
  if (!res.ok && useSchema && (res.status === 400 || res.status === 422)) {
    const firstError = await res.clone().text()
    if (/json_schema|response_format|structured/i.test(firstError)) {
      useSchema = false
      res = await send(false)
    }
  }

  // Rate limit: satu percobaan ulang, hormati retry-after, jangan menggantung.
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"))
    const waitMs = Math.min(
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000,
      10_000
    )
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    res = await send(useSchema)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status} ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Provider mengembalikan jawaban kosong.")
  }
  return content
}
