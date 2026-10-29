"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Loader2, Key, Eye, EyeOff, ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { setProvider, setApiKey, clearAllData, useStoredProvider, useStoredApiKey } from "@/lib/storage/settings"
import { getProviderEndpoint } from "@/lib/ai/client"
import SiteHeader from "@/components/site-header"

type Provider = "groq" | "openai" | "gemini" | "claude" | "deepseek" | "ollama"

const PROVIDERS: { id: Provider; name: string; description: string; recommended?: boolean }[] = [
  { id: "groq", name: "Groq", description: "Default - CORS verified, free tier cukup, Whisper large-v3", recommended: true },
  { id: "openai", name: "OpenAI", description: "Alternatif - Butuh akun, kualitas tinggi, harga mahal" },
  { id: "gemini", name: "Gemini 3.x", description: "Lanjutan - Butuh akun Google Cloud, config manual" },
  { id: "claude", name: "Claude 4.x", description: "Lanjutan - Butuh akun Anthropic, config manual" },
  { id: "deepseek", name: "DeepSeek v4", description: "Lanjutan - Butuh akun DeepSeek, config manual" },
  { id: "ollama", name: "Ollama (Lokal)", description: "Lanjutan - Butuh Ollama terinstall di laptop" },
]

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const storedProvider = useStoredProvider()
  const storedKey = useStoredApiKey()
  const [providerDraft, setProviderDraft] = useState<Provider | null>(null)
  const [keyDraft, setKeyDraft] = useState<string | null>(null)
  const provider = providerDraft ?? storedProvider
  const apiKey = keyDraft ?? storedKey
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const goHome = () => {
    router.push("/")
  }

  const saveSettings = () => {
    setProvider(provider as "groq" | "openai")
    setApiKey(apiKey)
    toast({ title: "Pengaturan disimpan", description: "API key dan provider berhasil disimpan." })
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
      setProviderDraft(null)
      toast({ title: "Data dihapus", description: "Semua data berhasil dihapus." })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Link>
          <h1 className="text-2xl font-bold">Pengaturan</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pilih Provider AI</CardTitle>
            <CardDescription>Pilih provider yang ingin kamu gunakan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">                {PROVIDERS.filter(p => p.id === "groq" || p.id === "openai").map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProviderDraft(p.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-colors",
                    provider === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {p.name}
                        {p.recommended && <span className="text-xs bg-primary/12 text-foreground px-2 py-0.5 rounded-full">Direkomendasikan</span>}
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
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
              Lihat opsi lanjut
            </button>

            {showAdvanced && (
              <div className="space-y-2 pt-2">
                {PROVIDERS.filter(p => !["groq", "openai"].includes(p.id)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProviderDraft(p.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      provider === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
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

        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>Masukkan API key dari provider yang dipilih.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing || !apiKey} variant="outline">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Uji Koneksi
              </Button>
            </div>

            {testResult && (
              <div className={cn(
                "flex items-center gap-2 text-sm p-3 rounded-lg",
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
            <CardTitle>Batas Provider</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Ukuran file STT: 25 MB</p>
            <p>• Audio per hari: 28.800 detik (8 jam) di free tier</p>
            <p>• Request per menit: 20 (STT), 30 (LLM)</p>
            <p>• Token per menit: 200K</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
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

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button onClick={goHome} size="lg" className="flex-1 gap-2">
            <Home className="h-5 w-5" />
            Kembali ke Beranda
          </Button>
          <Button variant="outline" onClick={saveSettings} className="flex-1 sm:w-auto">
            Simpan & Tetap di Sini
          </Button>
        </div>
      </div>
    </div>
  )
}