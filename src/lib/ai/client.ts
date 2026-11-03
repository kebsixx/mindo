export type Provider = "groq" | "openai"

export function getProviderEndpoint(provider: Provider): string {
  if (provider === "groq") return "https://api.groq.com/openai/v1"
  return "https://api.openai.com/v1"
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
  const endpoint = getProviderEndpoint(provider)
  const model = provider === "groq" ? "whisper-large-v3" : "whisper-1"

  const formData = new FormData()
  formData.append("file", toProviderAudio(file))
  formData.append("model", model)
  formData.append("language", "id")
  formData.append("response_format", "verbose_json")
  formData.append("timestamp_granularities[]", "segment")
  formData.append("temperature", "0")

  const res = await fetch(`${endpoint}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
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
  const endpoint = getProviderEndpoint(provider)
  const model = provider === "groq" ? "openai/gpt-oss-120b" : "gpt-4o-mini"

  const body: Record<string, unknown> = {
    model,
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
    return fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })
  }

  let res = await send(Boolean(schema))

  // Sebagian model/akun menolak structured output. Ulangi tanpa itu; prompt
  // semua agen sudah meminta JSON murni, jadi hasilnya tetap bisa diparse.
  if (!res.ok && schema && (res.status === 400 || res.status === 422)) {
    const firstError = await res.clone().text()
    if (/json_schema|response_format|structured/i.test(firstError)) {
      res = await send(false)
    }
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