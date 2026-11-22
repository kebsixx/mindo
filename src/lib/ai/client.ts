import { PROVIDERS } from "./providers"
import { getModel } from "@/lib/storage/settings"
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

  // Skema dikirim dua kali: sebagai `response_format` (kalau provider
  // menegakkannya) dan sebagai teks di prompt (selalu). Provider yang cuma
  // punya JSON mode tidak pernah melihat bentuk yang diminta, jadi tanpa teks
  // ini model menebak dan mindmap gagal parse.
  const schemaText =
    schema && info.structured === "json_object"
      ? `\n\nBalas dengan satu objek JSON valid yang mengikuti skema ini:\n${JSON.stringify(
          stripSchemaMeta(schema)
        )}`
      : ""

  const body: Record<string, unknown> = {
    model: getModel(provider),
    messages: [
      { role: "system", content: `${systemPrompt}${schemaText}` },
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
      payload.response_format =
        info.structured === "json_schema"
          ? {
              type: "json_schema",
              json_schema: {
                name: "response",
                strict: true,
                schema: stripSchemaMeta(schema),
              },
            }
          : { type: "json_object" }
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

  // Provider boleh menolak permintaan terstruktur dengan alasan apa pun
  // (skema terlalu berat, parameter tidak dikenal). Prompt sudah membawa
  // skemanya, jadi satu percobaan tanpa `response_format` tetap bisa diparse.
  if (!res.ok && useSchema && (res.status === 400 || res.status === 422)) {
    const firstError = await res.clone().text()
    console.warn(
      `[mindo] ${info.label} menolak format terstruktur, ulang tanpa response_format:`,
      firstError.slice(0, 300)
    )
    useSchema = false
    res = await send(false)
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

/** Model kadang membungkus JSON dengan blok kode markdown. */
export function parseModelJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim()
  return JSON.parse(cleaned)
}

/**
 * Jawaban model kadang terpotong sehingga JSON gagal diparse. Percobaan kedua
 * yang manual terbukti sering berhasil, jadi ulangi sekali di sini sebelum
 * menyerahkan kegagalan ke pengguna.
 */
export async function chatCompletionParsed<T>(
  provider: Provider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown> | undefined,
  parse: (raw: string) => T,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const raw = await chatCompletion(
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    schema,
    options
  )
  try {
    return parse(raw)
  } catch (first) {
    const retry = await chatCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      schema,
      options
    )
    try {
      return parse(retry)
    } catch {
      throw first
    }
  }
}
