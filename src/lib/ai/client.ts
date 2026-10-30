export type Provider = "groq" | "openai"

export function getProviderEndpoint(provider: Provider): string {
  if (provider === "groq") return "https://api.groq.com/openai/v1"
  return "https://api.openai.com/v1"
}

export async function transcribeAudio(
  provider: Provider,
  apiKey: string,
  file: Blob
): Promise<{ text: string; segments: { id: number; start: number; end: number; text: string }[]; duration: number }> {
  const endpoint = getProviderEndpoint(provider)
  const model = provider === "groq" ? "whisper-large-v3" : "whisper-1"

  const formData = new FormData()
  formData.append("file", file)
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
    throw new Error(err)
  }

  return res.json()
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
    include_reasoning: false,
    reasoning_effort: "low",
  }

  if (schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "response", strict: true, schema },
    }
  }

  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens
  }

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}