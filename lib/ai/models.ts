// Model IDs centralized in lib/ai/models.ts
// Diverifikasi 22 Oktober 2026 - model-model ini tersedia di environment OpenCode (9router)
// Ganti di satu tempat kalau provider berubah.

// GROQ (rekomendasi default)
export const MODELS = {
  groq: {
    // Speech-to-Text: whisper-large-v3 terbaik untuk Indonesia
    stt: "whisper-large-v3",
    // LLM utama: gpt-oss-120b kualitas tinggi, 20b Fast untuk fallback
    llm: "openai/gpt-oss-120b",
    // LLM fast fallback saat 120b overloaded
    llmFast: "openai/gpt-oss-20b",
    // Groq tidak punya endpoint embeddings → Retrieval leksikal BM25 di browser
    embed: null,
  },
} as const;

// OpenAI (provider sekunder - butuh akun sendiri)
export const OPENAI = {
  stt: "whisper-1",
  llm: "gpt-4o-mini",
  // Embeddings hanya untuk fitur RAG opsional (butuh akun OpenAI kedua)
  embed: "text-embedding-3-small",
} as const;

// Provider tambahan (tersedia di environment OpenCode 9router)
// Catatan: Butuh konfigurasi di opencode.json atau client fetch manual
export const ADDITIONAL_PROVIDERS = {
  // Google Gemini 3.x (terbaru)
  gemini: {
    // Model flash cepat untuk ekstraksi
    llm: "gemini-3.8-flash-high",
    // Fallback lebih ringan
    llmFast: "gemini-3.5-flash-low",
    // STT via Gemini (butuh endpoint terpisah)
    stt: null,
    // Embedding tersedia
    embed: "gemini-embedding-001",
  },

  // Anthropic Claude 4.x
  claude: {
    llm: "claude-sonnet-4-6",
    llmFast: "claude-opus-4-6-thinking",
    stt: null,
    embed: null,
  },

  // DeepSeek v4
  deepseek: {
    llm: "deepseek-v4-pro",
    llmFast: "deepseek-v4-flash",
    stt: null,
    embed: null,
  },

  // Ollama (local) - butuh Ollama terinstall di laptop user
  ollama: {
    // LLM lokal yang running di laptop
    llm: "ollama/gpt-oss:120b",
    llmFast: "ollama/qwen3.5",
    // STT via Whisper WASM atau Ollama
    stt: "whisper-large-v3", // via Ollama API
    embed: null,
  },
} as const;

// Catatan penting:
// - Semua model di atas supported di Groq free tier kecuali embed OpenAI
// - Temperature: 0 untuk agen ekstraksi (summarizer, mindmapper, flashcarder)
// - Temperature: 0.3 untuk tutor (memungkinkan variasi jawaban)
// - include_reasoning: false dan reasoning_effort: "low" untuk model gpt-oss
// - Structured outputs strict mode: tersedia di openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3.8-27b
// - Tidak ada streaming bersama structured outputs
// - Max tokens: 131.072 context window, transkrip 1 jam ≈ 15.000 token muat penuh
// - Provider tambahan (gemini/claude/deepseek/ollama) butuh config di opencode.json atau client custom
// - Local model (ollama) butuh laptop kuat & instalasi Ollama, cocok buat mahasiswa gaming