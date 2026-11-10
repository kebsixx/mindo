// Satu-satunya daftar provider AI. `Provider` diturunkan dari sini, jadi
// menambah provider cukup menambah satu entri.
//
// ponytail: model ID di-hardcode per provider. Ceiling: provider menaikkan
// versi model dan Mindo ketinggalan sampai kode diubah. Upgrade: simpan
// override model di settings lalu baca lewat getModel(provider, kind).

export const PROVIDERS = {
  groq: {
    label: "Groq",
    description: "Default. Transkripsi Whisper, free tier permanen.",
    baseUrl: "https://api.groq.com/openai/v1",
    stt: "whisper-large-v3",
    llm: "openai/gpt-oss-120b",
    llmFast: "openai/gpt-oss-20b",
    billing: "Gratis",
    billingNote:
      "Free tier permanen, tanpa kartu kredit. Ada batas request dan audio per hari.",
    data: "Tidak dilatih",
    dataNote: "Groq menyatakan data API tidak dipakai untuk melatih model.",
    keyless: false,
    keysUrl: "https://console.groq.com/keys",
    keysLabel: "console.groq.com/keys",
    placeholder: "gsk_...",
    signup:
      "Daftar di console.groq.com dengan akun Google atau email. Free tier langsung aktif tanpa kartu kredit.",
    note: "Kunci berawalan gsk_ dan hanya ditampilkan sekali saat dibuat.",
    limits: [
      "File audio maksimal 25 MB",
      "Whisper: sekitar 8 jam audio per hari (free tier)",
      "30 request LLM per menit, 200K token per menit",
    ],
  },
  openai: {
    label: "OpenAI",
    description: "Kualitas tinggi, berbayar. Bisa transkripsi Whisper.",
    baseUrl: "https://api.openai.com/v1",
    stt: "whisper-1",
    llm: "gpt-4o-mini",
    llmFast: "gpt-4o-mini",
    billing: "Berbayar",
    billingNote:
      "Bayar per penggunaan. Tidak ada free tier API permanen, saldo harus diisi dulu.",
    data: "Tidak dilatih",
    dataNote: "Data API tidak dipakai melatih model secara default.",
    keyless: false,
    keysUrl: "https://platform.openai.com/api-keys",
    keysLabel: "platform.openai.com/api-keys",
    placeholder: "sk-...",
    signup:
      "Daftar di platform.openai.com, buka Billing, lalu isi saldo minimal. Kartu kredit wajib.",
    note: "Kunci berawalan sk- dan hanya ditampilkan sekali saat dibuat.",
    limits: [
      "File audio maksimal 25 MB",
      "Ditagih per menit audio dan per token",
      "Rate limit mengikuti tier akun",
    ],
  },
  gemini: {
    label: "Gemini",
    description:
      "Free tier untuk teks, tapi datanya dipakai Google. Belum ada transkripsi.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    stt: null,
    llm: "gemini-2.5-flash",
    llmFast: "gemini-2.5-flash-lite",
    billing: "Gratis + berbayar",
    billingNote:
      "Free tier tersedia dengan kuota harian. Paid tier untuk kuota lebih besar.",
    data: "Tergantung tier",
    dataNote:
      "Free tier: data dipakai memperbaiki produk dan bisa ditinjau manusia. Paid tier: tidak dilatih.",
    keyless: false,
    keysUrl: "https://aistudio.google.com/apikey",
    keysLabel: "aistudio.google.com/apikey",
    placeholder: "AIza...",
    signup: "Buat key di Google AI Studio dengan akun Google.",
    note: "Endpoint kompatibilitas OpenAI Gemini belum punya rute transkripsi audio. Mindo v1 hanya memakai teksnya.",
    limits: [
      "Tanpa transkripsi audio di Mindo (v1)",
      "Free tier: kuota harian, data bisa dipakai untuk pelatihan",
      "Paid tier: data tidak dilatih",
    ],
  },
  openrouter: {
    label: "OpenRouter",
    description: "Satu key untuk banyak model teks. Belum ada transkripsi.",
    baseUrl: "https://openrouter.ai/api/v1",
    stt: null,
    llm: "meta-llama/llama-3.3-70b-instruct:free",
    llmFast: "meta-llama/llama-3.3-70b-instruct:free",
    billing: "Gratis + berbayar",
    billingNote:
      "Model :free terbatas 20 request/menit dan 50/hari. Setelah top up $10, 1.000/hari.",
    data: "Tergantung model",
    dataNote:
      "Kebijakan data mengikuti model dan penyedia yang dirutekan OpenRouter.",
    keyless: false,
    keysUrl: "https://openrouter.ai/keys",
    keysLabel: "openrouter.ai/keys",
    placeholder: "sk-or-...",
    signup: "Daftar di openrouter.ai, lalu buat key di halaman Keys.",
    note: "Model gratis bisa diganti atau dihapus provider tanpa pemberitahuan.",
    limits: [
      "Tanpa transkripsi audio di Mindo (v1)",
      "Model gratis: 20 request/menit, 50/hari",
      "1.000/hari setelah top up minimal $10",
    ],
  },
  deepseek: {
    label: "DeepSeek",
    description: "Murah untuk teks. Berbayar, belum ada transkripsi.",
    baseUrl: "https://api.deepseek.com",
    stt: null,
    llm: "deepseek-flash",
    llmFast: "deepseek-flash",
    billing: "Berbayar",
    billingNote: "Isi saldo dulu. Harga off-peak lebih murah.",
    data: "Perlu dicek",
    dataNote:
      "Kebijakan data DeepSeek bisa berubah. Baca privasinya sebelum mengunggah materi sensitif.",
    keyless: false,
    keysUrl: "https://platform.deepseek.com/api_keys",
    keysLabel: "platform.deepseek.com/api_keys",
    placeholder: "sk-...",
    signup: "Daftar di platform.deepseek.com, buat key, lalu isi saldo.",
    note: "Tidak ada free tier permanen.",
    limits: [
      "Tanpa transkripsi audio di Mindo (v1)",
      "Ditagih per token",
      "Harga lebih murah di jam off-peak",
    ],
  },
  ollama: {
    label: "Ollama",
    description: "Jalan di komputer Anda. Tanpa key, data tidak keluar.",
    baseUrl: "http://localhost:11434/v1",
    stt: null,
    llm: "llama3.1",
    llmFast: "llama3.1",
    billing: "Lokal",
    billingNote: "Gratis. Biayanya listrik dan perangkat Anda sendiri.",
    data: "Lokal",
    dataNote: "Audio dan teks tidak dikirim ke server pihak ketiga.",
    keyless: true,
    keysUrl: "https://ollama.com/download",
    keysLabel: "ollama.com/download",
    placeholder: "",
    signup:
      "Pasang Ollama, jalankan ollama pull llama3.1, lalu biarkan server hidup di localhost:11434.",
    note: "Browser memblokir CORS kecuali OLLAMA_ORIGINS memuat alamat Mindo.",
    limits: [
      "Tanpa transkripsi audio di Mindo (v1)",
      "Tanpa API key dan tanpa kuota",
      "Butuh Ollama berjalan di komputer Anda",
      "Set OLLAMA_ORIGINS agar browser diizinkan",
    ],
  },
} as const;

export type Provider = keyof typeof PROVIDERS;

export type ProviderRole = "stt" | "llm";

export const ROLE_LABELS = {
  stt: {
    title: "Transkripsi",
    short: "transkripsi",
    description:
      "Mengubah rekaman jadi teks. Audio hanya dikirim ke provider ini.",
  },
  llm: {
    title: "Ringkasan & teks",
    short: "ringkasan",
    description:
      "Mengolah transkrip jadi ringkasan, mindmap, flashcard, dan jawaban tutor.",
  },
} as const;

export const PROVIDER_IDS = Object.keys(PROVIDERS) as Provider[];

export const DEFAULT_PROVIDERS: Record<ProviderRole, Provider> = {
  stt: "groq",
  llm: "groq",
};

export function isProvider(value: string): value is Provider {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

export function supportsRole(provider: Provider, role: ProviderRole): boolean {
  return role === "stt" ? PROVIDERS[provider].stt !== null : Boolean(PROVIDERS[provider].llm);
}

export function providerIdsFor(role: ProviderRole): Provider[] {
  return PROVIDER_IDS.filter((id) => supportsRole(id, role));
}

/** Kalimat jujur soal ke mana audio dan teks pergi untuk pasangan provider ini. */
export function privacySummary(stt: Provider, llm: Provider): string {
  const sttLocal = PROVIDERS[stt].keyless;
  const llmLocal = PROVIDERS[llm].keyless;
  if (stt === llm) {
    return sttLocal
      ? "Audio dan teks diproses di komputer ini."
      : `Audio dan teks dikirim ke ${PROVIDERS[stt].label}.`;
  }
  if (sttLocal && llmLocal) {
    return "Audio dan teks diproses di komputer ini.";
  }
  if (sttLocal) {
    return `Audio diproses di komputer ini. Teks transkrip dikirim ke ${PROVIDERS[llm].label}.`;
  }
  if (llmLocal) {
    return `Audio dikirim ke ${PROVIDERS[stt].label}. Teks transkrip diproses di komputer ini.`;
  }
  return `Audio dikirim ke ${PROVIDERS[stt].label}. Teks transkrip dikirim ke ${PROVIDERS[llm].label}.`;
}
