export const MODELS = {
  groq: {
    stt: "whisper-large-v3",
    llm: "openai/gpt-oss-120b",
    llmFast: "openai/gpt-oss-20b",
    embed: null,
  },
  openai: {
    stt: "whisper-1",
    llm: "gpt-4o-mini",
    embed: "text-embedding-3-small",
  },
} as const;