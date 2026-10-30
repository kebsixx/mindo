"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Key, Eye, EyeOff, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { setProvider, setApiKey, clearAllData, useStoredProvider, useStoredApiKey } from "@/lib/storage/settings"
import { getProviderEndpoint } from "@/lib/ai/client"
import SiteHeader, { BackLink } from "@/components/site-header"

type Provider = "groq" | "openai" | "gemini" | "claude" | "deepseek" | "ollama"

const PROVIDERS: {
  id: Provider
  name: string
  description: string
  recommended?: boolean
  keysAt: string
  keysLabel: string
  signup: string
  note: string
}[] = [
  {
    id: "groq",
    name: "Groq",
    description: "Default - CORS terverifikasi, free tier cukup, Whisper large-v3",
    recommended: true,
    keysAt: "https://console.groq.com/keys",
    keysLabel: "console.groq.com/keys",
    signup: "Daftar di console.groq.com dengan akun Google atau email. Free tier langsung aktif tanpa kartu kredit.",
    note: "Kunci berawalan gsk_ dan hanya ditampilkan sekali saat dibuat.",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Alternatif - Butuh akun, kualitas tinggi, harga mahal",
    keysAt: "https://platform.openai.com/api-keys",
    keysLabel: "platform.openai.com/api-keys",
    signup: "Daftar di platform.openai.com, buka Billing, lalu isi saldo minimal. Kartu kredit wajib.",
    note: "Kunci berawalan sk- dan hanya ditampilkan sekali saat dibuat.",
  },
  {
    id: "gemini",
    name: "Gemini 3.x",
    description: "Lanjutan - Butuh akun Google Cloud, config manual",
    keysAt: "https://aistudio.google.com/apikey",
    keysLabel: "aistudio.google.com/apikey",
    signup: "Buka Google AI Studio dengan akun Google, klik Create API key, pilih project. Ada kuota gratis.",
    note: "Batas gratis berbeda dari Groq; periksa halaman harga Google.",
  },
  {
    id: "claude",
    name: "Claude 4.x",
    description: "Lanjutan - Butuh akun Anthropic, config manual",
    keysAt: "https://console.anthropic.com/settings/keys",
    keysLabel: "console.anthropic.com/settings/keys",
    signup: "Daftar di console.anthropic.com, buka Billing, lalu isi kredit. Kartu kredit wajib.",
    note: "Kunci berawalan sk-ant- dan hanya ditampilkan sekali.",
  },
  {
    id: "deepseek",
    name: "DeepSeek v4",
    description: "Lanjutan - Butuh akun DeepSeek, config manual",
    keysAt: "https://platform.deepseek.com/api_keys",
    keysLabel: "platform.deepseek.com/api_keys",
    signup: "Daftar di platform.deepseek.com, buka Top up, lalu isi saldo. Harga per token paling murah di daftar ini.",
    note: "Kunci berawalan sk- dan hanya ditampilkan sekali.",
  },
  {
    id: "ollama",
    name: "Ollama (Lokal)",
    description: "Lanjutan - Butuh Ollama terinstall di laptop",
    keysAt: "https://ollama.com/download",
    keysLabel: "ollama.com/download",
    signup: "Tidak ada API key. Install Ollama, jalankan ollama pull model, lalu biarkan berjalan di localhost.",
    note: "Tidak ada biaya dan tidak ada data yang keluar dari perangkat Anda.",
  },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const storedProvider = useStoredProvider()
  const storedKey = useStoredApiKey()
  const [keyDraft, setKeyDraft] = useState<string | null>(null)
  const provider = storedProvider
  const apiKey = keyDraft ?? storedKey
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const chooseProvider = (next: Provider) => {
    setProvider(next as "groq" | "openai")
    toast({ title: "Provider disimpan", description: `${next} dipakai untuk pemrosesan berikutnya.` })
  }

  const commitKey = (value: string) => {
    setKeyDraft(value)
    if (value === storedKey) return
    setApiKey(value.trim())
    if (value.trim()) toast({ title: "API key disimpan" })
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const endpoint = getProviderEndpoint(provider as "groq" | "openai")
      const startedAt = performance.now()
      const res = await fetch(`${endpoint}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const elapsed = Math.round(performance.now() - startedAt)
      if (res.ok) {
        setTestResult({ ok: true, message: `Koneksi berhasil, respons ${elapsed} ms.` })
      } else if (res.status === 401 || res.status === 403) {
        setTestResult({ ok: false, message: "API key ditolak provider. Periksa kembali kuncinya." })
      } else if (res.status === 429) {
        setTestResult({ ok: false, message: "Terlalu banyak permintaan. Coba lagi sebentar lagi." })
      } else {
        setTestResult({ ok: false, message: `Provider menolak permintaan (kode ${res.status}).` })
      }
    } catch {
      setTestResult({ ok: false, message: "Jaringan gagal menghubungi provider. Periksa koneksi internet Anda." })
    } finally {
      setTesting(false)
    }
  }

  const handleClearAll = () => {
    if (confirm("Hapus semua data? Tindakan ini tidak bisa dibatalkan.")) {
      clearAllData()
      setKeyDraft("")
      toast({ title: "Data dihapus", description: "Semua data berhasil dihapus." })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />

      <main className="mx-auto w-full max-w-180 flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-6">
        <BackLink href="/" label="Kembali ke beranda" />
        <h1 className="mt-2 text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">Pengaturan</h1>
        <p className="mt-3 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          Pilih provider, tempel API key, lalu uji koneksinya sebelum memproses rekaman.
        </p>

        <div className="mt-10 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pilih Provider AI</CardTitle>
              <CardDescription>Pilih provider yang ingin Anda gunakan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div role="radiogroup" aria-label="Provider AI" className="space-y-2">
                {PROVIDERS.filter(p => p.id === "groq" || p.id === "openai").map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={provider === p.id}
                  onClick={() => chooseProvider(p.id)}
                  className={cn(
                    "w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                    provider === p.id ? "border-primary bg-primary/12" : "border-border hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {p.name}
                        {p.recommended && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-foreground">Direkomendasikan</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                    </div>
                    {provider === p.id && <CheckCircle className="h-5 w-5 text-foreground" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
              Lihat opsi lanjut
            </button>

            {showAdvanced && (
              <div role="radiogroup" aria-label="Provider AI lanjutan" className="space-y-2 pt-2">
                {PROVIDERS.filter(p => !["groq", "openai"].includes(p.id)).map((p) => (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={provider === p.id}
                    onClick={() => chooseProvider(p.id)}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                      provider === p.id ? "border-primary bg-primary/12" : "border-border hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.description}</div>
                      </div>
                      {provider === p.id && <CheckCircle className="h-5 w-5 text-foreground" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          <Card id="panduan-api-key" className="scroll-mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Cara mendapatkan API key</CardTitle>
              <CardDescription>
                Panduan singkat untuk setiap provider. Ikuti yang sesuai pilihan Anda di atas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {PROVIDERS.filter((p) => p.id === provider || !["gemini", "claude", "deepseek", "ollama"].includes(p.id) || showAdvanced).map((p) => (
                  <li key={p.id}>
                    <div
                      className={cn(
                        "rounded-2xl p-4",
                        provider === p.id ? "bg-primary/12" : "bg-secondary"
                      )}
                    >
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className="font-medium">{p.name}</p>
                        {p.recommended && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-foreground">
                            Mulai di sini
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[0.9375rem] leading-[1.55]">{p.signup}</p>
                      <p className="mt-1 text-[0.9375rem] leading-[1.55] text-muted-foreground">{p.note}</p>
                      <a
                        href={p.keysAt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] underline decoration-1 underline-offset-4 hover:text-muted-foreground"
                      >
                        {p.keysLabel}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">(buka di tab baru)</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[0.9375rem] leading-[1.55] text-muted-foreground">
                Halaman ini hanya menautkan ke situs resmi provider. Mindo tidak pernah menerima key Anda.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Key</CardTitle>
              <CardDescription>Masukkan API key dari provider yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="api-key-field" className="text-[0.9375rem] font-medium">
                  API key {provider}
                </label>
                <div className="relative mt-2">
                  <Input
                    id="api-key-field"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => commitKey(e.target.value)}
                    placeholder={provider === "openai" ? "sk-..." : "gsk_..."}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 rounded-full pl-4 pr-11 text-base"
                  />
                  <button
                    type="button"
                    aria-label={showKey ? "Sembunyikan API key" : "Lihat API key"}
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-[0.875rem] leading-snug text-muted-foreground">
                  Tersimpan otomatis begitu Anda mengetik. Tidak ada tombol simpan yang perlu ditekan.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={testing || !apiKey} variant="outline">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  Uji Koneksi
                </Button>
              </div>

              {testResult && (
                <div className={cn(
                  "flex items-center gap-2 rounded-2xl p-3 text-sm",
                  testResult.ok ? "bg-primary/12 text-foreground" : "bg-destructive/10 text-destructive"
                )}>
                  {testResult.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {testResult.message}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Batas Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-[0.9375rem] text-muted-foreground">
              <p>Ukuran file STT: 25 MB</p>
              <p>Audio per hari: 28.800 detik (8 jam) di free tier</p>
              <p>Request per menit: 20 (STT), 30 (LLM)</p>
              <p>Token per menit: 200K</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertCircle className="h-5 w-5" />
                Zona Bahaya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleClearAll}>
                Hapus Semua Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-[0.9375rem] text-muted-foreground">
          Semua perubahan langsung tersimpan.{" "}
          <Link href="/" className="underline decoration-1 underline-offset-4 hover:text-foreground">
            Kembali ke beranda
          </Link>
        </p>
      </main>
    </div>
  )
}